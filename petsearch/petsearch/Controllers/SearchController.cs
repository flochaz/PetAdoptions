using System;
using System.Text.Json;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.DynamoDBv2.Model;
using Amazon;
using Newtonsoft.Json;

using Amazon.S3;
using Amazon.S3.Model;
using Amazon.XRay.Recorder.Handlers.AwsSdk;
using Amazon.XRay.Recorder.Core;

namespace PetSearch.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private static IAmazonDynamoDB ddbClient;
        private static IAmazonS3 s3Client;

        private static string S3TableName = "petadoptions";
        private static readonly string _bucketName = "observabilitypetadoptions";

        private static string _urlString;

        public SearchController(IConfiguration config)
        {
            _urlString = config["defaultimage"];
            AWSSDKHandler.RegisterXRayForAllServices();
            ddbClient = new AmazonDynamoDBClient();
            s3Client = new AmazonS3Client();
        }

        private static Func<string, string, string> GetPetURL = (pettype, petid) =>
        {
            AWSSDKHandler.RegisterXRay<IAmazonS3>();

            string GetFolderName(string pettype)
            {
                switch (pettype)
                {
                    case "bunny":
                        return "bunnies";
                    case "puppy":
                        return "puppies";
                    default:
                        return "kitten";
                }
            }

            try
            {
                s3Client.EnsureBucketExistsAsync(_bucketName).RunSynchronously();

                GetPreSignedUrlRequest request1 = new GetPreSignedUrlRequest
                {
                    BucketName = _bucketName,
                    Key = $"{GetFolderName(pettype)}/{petid}.jpg",
                    Expires = DateTime.Now.AddMinutes(5)
                };

                _urlString = s3Client.GetPreSignedURL(request1);

               
                
            }
            catch (AmazonS3Exception e)
            {
                Console.WriteLine("Error encountered on server. Message:'{0}'", e.Message);
                AWSXRayRecorder.Instance.AddException(e);
                throw e;
            }
            catch (Exception e)
            {
                Console.WriteLine("Unknown encountered on server. Message:'{0}'", e.Message);
                AWSXRayRecorder.Instance.AddException(e);
                throw e;
            }
            return _urlString;
        };

        private Func<List<Dictionary<string, AttributeValue>>, string> BuildPets = (resultItems) =>
             {
                 var Pets = new List<Pet>();

                 resultItems.ForEach(item => Pets.Add(new Pet()
                 {
                     petid = item["petid"].S,
                     availability = item["availability"].S,
                     cuteness_rate = item["cuteness_rate"].S,
                     petcolor = item["petcolor"].S,
                     pettype = item["pettype"].S,
                     price = item["price"].S,
                     peturl = GetPetURL(item["pettype"].S, item["image"].S)
                 }));

                 AWSXRayRecorder.Instance.AddMetadata("Pets", System.Text.Json.JsonSerializer.Serialize(Pets));

                 Console.WriteLine($"[{AWSXRayRecorder.Instance.GetEntity().TraceId}] - {System.Text.Json.JsonSerializer.Serialize(Pets)}");

                 return JsonConvert.SerializeObject(Pets);

             };

        // Usage - GET: /api/search?pettype=puppy&petcolor=brown&petid=001
        [HttpGet]
        public async Task<string> Get([FromQuery] SearchParams searchParams)
        {
            try
            {

                ScanFilter scanFilter = new ScanFilter();

                if (!String.IsNullOrEmpty(searchParams.petcolor)) scanFilter.AddCondition("petcolor", ScanOperator.Equal, searchParams.petcolor);
                if (!String.IsNullOrEmpty(searchParams.pettype)) scanFilter.AddCondition("pettype", ScanOperator.Equal, searchParams.pettype);
                if (!String.IsNullOrEmpty(searchParams.petid)) scanFilter.AddCondition("petid", ScanOperator.Equal, searchParams.petid);

                var scanquery = new ScanRequest
                {
                    TableName = S3TableName,
                    ScanFilter = scanFilter.ToConditions()
                };

                AWSXRayRecorder.Instance.AddAnnotation("Query", $"petcolor:{searchParams.petcolor}-pettype:{searchParams.pettype}-petid:{searchParams.petid}");
                Console.WriteLine($"[{AWSXRayRecorder.Instance.GetEntity().TraceId}] - {searchParams}");

                var response = await ddbClient.ScanAsync(scanquery);
                return BuildPets(response.Items);
            }
            catch (Exception e)
            {
                return e.Message;
            }
        }
    }
}
