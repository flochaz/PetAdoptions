using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Amazon.XRay.Recorder.Handlers.AwsSdk;
using Amazon.XRay.Recorder.Handlers.SqlServer;
using System.Data.SqlClient;
using Amazon.XRay.Recorder.Handlers.System.Net;
using Amazon.XRay.Recorder.Core;

namespace PayForAdoption.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HomeController : ControllerBase
    {
        private static SqlConnection _sqlConnection = new SqlConnection();
        private static HttpClient _httpClient = new HttpClient(new HttpClientXRayTracingHandler(new HttpClientHandler()));

        public HomeController()
        {
            AWSSDKHandler.RegisterXRayForAllServices();
        }

        [HttpPost("/api/home/CompleteAdoption")]
        public string CompleteAdoption([FromQuery] string petId)
        {
            try
            {
                Console.WriteLine($"[{AWSXRayRecorder.Instance.GetEntity().TraceId}] - In CompleteAdoption Action method - PetId : {petId}");
                AWSXRayRecorder.Instance.AddAnnotation("PetId", petId);
                
                _sqlConnection.ConnectionString = "Server=petadoptions.cx0zrn5o9z2t.us-east-1.rds.amazonaws.com;Database=adoptions;User Id=admin;Password=6lvFKO3nTEK4AZD5mMiD;";

                var sqlCommandText = $"INSERT INTO [dbo].[transactions] ([PetId], [Transaction_Id], [Adoption_Date]) VALUES ('{petId}', '{Guid.NewGuid().ToString()}', '{DateTime.Now.ToString()}')";

                AWSXRayRecorder.Instance.AddMetadata("Query",sqlCommandText);

                using (_sqlConnection)
                {
                    using var command = new TraceableSqlCommand(sqlCommandText, _sqlConnection);
                    command.Connection.Open();
                    command.ExecuteNonQuery();
                }
            }
            catch (Exception e)
            {
                return e.Message;
            }

            AWSXRayRecorder.Instance.TraceMethod("UpdateAvailability", () => UpdateAvailability(petId));

            return "Success";
        }

        [HttpGet("/api/home/healthcheck")]
        public string HealthCheck()
        {
            return "Alive";
        }

        private static async Task<string> UpdateAvailability(string petid)
        {
            AWSXRayRecorder.Instance.BeginSubsegment("Invoking Availability API");
            //Do something here

            var result = await _httpClient.GetStringAsync("https://amazon.com");
            AWSXRayRecorder.Instance.EndSubsegment();
            return "Complete";
        }
    }
}