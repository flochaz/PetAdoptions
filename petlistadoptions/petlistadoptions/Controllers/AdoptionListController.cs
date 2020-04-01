using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Amazon.XRay.Recorder.Core;
using Amazon.XRay.Recorder.Handlers.AwsSdk;
using Amazon.XRay.Recorder.Handlers.SqlServer;
using Amazon.XRay.Recorder.Handlers.System.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace PetListAdoptions.Controllers
{
    public class AdoptionListController : Controller
    {
        private static IConfiguration _configuration;
        private static SqlConnection _sqlConnection = new SqlConnection();
        private static HttpClient httpClient;

        public AdoptionListController(IConfiguration configuration)
        {
            _configuration = configuration;
            httpClient   = new HttpClient(new HttpClientXRayTracingHandler(new HttpClientHandler()));

            AWSSDKHandler.RegisterXRayForAllServices();
        }
        
        // GET
        [HttpGet]
        public async Task<IEnumerable<AdoptionItem>> Get()
        {
            List<AdoptionItem> adoptionItems = new List<AdoptionItem>();

            try
            {
                AWSXRayRecorder.Instance.BeginSubsegment("Fetching adoption list");
                Console.WriteLine($"[{AWSXRayRecorder.Instance.GetEntity().TraceId}] - Fetching adopted pets list from database");

                _sqlConnection.ConnectionString = _configuration["rdsconnectionstring"];

                var sqlCommandText = $"SELECT TOP 25 * FROM [dbo].[transactions]";

                AWSXRayRecorder.Instance.AddMetadata("Query", sqlCommandText);
                using (_sqlConnection)
                {
                    var command = new TraceableSqlCommand(sqlCommandText, _sqlConnection);
                    command.Connection.Open();
                    using (SqlDataReader reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            Console.Write($"{reader.GetValue(1)} | {reader.GetValue(2)} | {reader.GetValue(3)}");
                            var petItem = await httpClient.GetStringAsync($"{_configuration["searchapiurl"]}&petid={reader.GetValue(1)}");
                            var adoptionItem = JsonSerializer.Deserialize<AdoptionItem>(petItem);
                            adoptionItem.transactionid = reader.GetValue(3).ToString();
                            adoptionItem.adoptiondate = reader.GetValue(2).ToString();
                            adoptionItems.Add(adoptionItem);
                            Console.WriteLine();
                        }
                    }
                }
            }
            catch (Exception e)
            {
                Console.WriteLine($"EXCEPTION - { e.Message}");
                AWSXRayRecorder.Instance.AddException(e);
            }
            finally
            {
                AWSXRayRecorder.Instance.EndSubsegment();
            }

            return adoptionItems;
        }
        
        
    }
}