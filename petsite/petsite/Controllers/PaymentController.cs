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
                
                Console.WriteLine($"[{AWSXRayRecorder.Instance.GetEntity().TraceId}] - In CompleteAdoption Action method - PetId:{petId} - PetType:{pettype}");
                AWSXRayRecorder.Instance.AddAnnotation("PetId", petId);
                AWSXRayRecorder.Instance.AddAnnotation("PetType", pettype);

                
                var result = await PostTransaction(petId, pettype);
                AWSXRayRecorder.Instance.EndSubsegment();

                AWSXRayRecorder.Instance.BeginSubsegment("Post Message to SQS");
                var messageResponse =  PostMessageToSQS(petId).Result;
                AWSXRayRecorder.Instance.EndSubsegment();
                
                AWSXRayRecorder.Instance.BeginSubsegment("Send Notification");
                var snsResponse =  SendNotification(petId).Result;
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

        private async Task<HttpResponseMessage> PostTransaction(string petId, string pettype)
        {
            return await _httpClient.PostAsync($"http://payforadoptions-542584011.us-east-1.elb.amazonaws.com/api/home/CompleteAdoption?petId={petId}&petType={pettype}", null);
        }

        private async Task<SendMessageResponse> PostMessageToSQS(string petId)
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