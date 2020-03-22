using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Amazon.XRay.Recorder.Core;
using Amazon.XRay.Recorder.Handlers.AwsSdk;
using Amazon.XRay.Recorder.Handlers.System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Amazon.SQS;
using Amazon.SQS.Model;
using System.Text.Json.Serialization;
using System.Text.Json;
using Amazon.Runtime;

using Amazon.SimpleNotificationService;
using Amazon.SimpleNotificationService.Model;

namespace PetSite.Controllers
{
    public class PaymentController : Controller
    {
        private static string _txStatus = String.Empty;
        private static HttpClient _httpClient = new HttpClient(new HttpClientXRayTracingHandler(new HttpClientHandler()));
        private static AmazonSQSClient _sqsClient;

        public PaymentController()
        {
            AWSSDKHandler.RegisterXRayForAllServices();
            _sqsClient = new AmazonSQSClient(Amazon.RegionEndpoint.USEast1);
        }

        // GET: Payment
        [HttpGet]
        private ActionResult Index()
        {
         //   ViewData["txStatus"] = _txStatus;
            return View();
        }

        // POST: Payment/MakePayment
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> MakePayment(string petId, string pettype)
        {
            ViewData["txStatus"] = "success";
        
            try
            {
                AWSXRayRecorder.Instance.BeginSubsegment("Call Payment API");
                
                Console.WriteLine($"[{AWSXRayRecorder.Instance.GetEntity().TraceId}] - In CompleteAdoption Action method - PetId : {petId}");
                AWSXRayRecorder.Instance.AddAnnotation("PetId", petId);
                
                var result = await PostTransaction(petId);
                AWSXRayRecorder.Instance.EndSubsegment();

                AWSXRayRecorder.Instance.BeginSubsegment("Post Message to SQS");
                var messageResponse =  PostMessagetoSQS(petId).Result;
                AWSXRayRecorder.Instance.EndSubsegment();
                
                AWSXRayRecorder.Instance.BeginSubsegment("Send Notification");
                var snsResponse =  SendNotification(petId).Result;
                AWSXRayRecorder.Instance.EndSubsegment();
                
                AWSXRayRecorder.Instance.BeginSubsegment("Update Adoption Status");
                var updateResponse =  UpdateAdoptionStatus(petId, pettype).Result;
                AWSXRayRecorder.Instance.EndSubsegment();

                return View("Index");
            }
            catch (Exception ex)
            {
                ViewData["txStatus"] = "failure";
                ViewData["error"] = ex.Message;
                AWSXRayRecorder.Instance.AddException(ex);
                return View("Index");
            }
        }

        private async Task<object> UpdateAdoptionStatus(string petId, string petType)
        {
            var putParams = new PutParams() {petid = petId, pettype = petType};
            
            StringContent putData = new StringContent(JsonSerializer.Serialize(putParams));
            return await _httpClient.PutAsync("https://3s920x41w3.execute-api.us-east-1.amazonaws.com/prod", putData);
        }

        private async Task<HttpResponseMessage> PostTransaction(string petId)
        {
            return await _httpClient.PostAsync($"http://payforadoptions-542584011.us-east-1.elb.amazonaws.com/api/home/CompleteAdoption?petId={petId}", null);
        }

        private async Task<SendMessageResponse> PostMessagetoSQS(string petId)
        {
            AWSSDKHandler.RegisterXRay<IAmazonSQS>();
            var sendMessageRequest = new SendMessageRequest()
            {
                MessageBody = JsonSerializer.Serialize(petId),
                QueueUrl = "https://sqs.us-east-1.amazonaws.com/831210339789/PetAdoptions"
            };
            return await _sqsClient.SendMessageAsync(sendMessageRequest);
        }

        private async Task<PublishResponse> SendNotification(string petId)
        {
            AWSSDKHandler.RegisterXRay<IAmazonService>();

            var snsClient = new AmazonSimpleNotificationServiceClient();
            return await snsClient.PublishAsync(topicArn: "arn:aws:sns:us-east-1:831210339789:PetAdoptionNotification", message: $"PetId {petId} was adopted on {DateTime.Now}");
        }
    }
}