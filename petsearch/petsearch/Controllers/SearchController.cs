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

using Amazon.S3;
using Amazon.S3.Model;
using Amazon.XRay.Recorder.Handlers.AwsSdk;
using Amazon.XRay.Recorder.Core;
using System.Threading;

using AWSSignatureV4_S3_Sample.Signers;
using System.Text;
using System.Net.Http;
using System.ComponentModel;

namespace PetSearch.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private static IAmazonDynamoDB ddbClient;
        private static IAmazonS3 s3Client;

        private static IConfiguration _configuration;

        public SearchController(IConfiguration configuration)
        {
            _configuration = configuration;

            AWSSDKHandler.RegisterXRayForAllServices();
            ddbClient = new AmazonDynamoDBClient();
            AWSConfigsS3.UseSignatureVersion4 = true;
            s3Client = new AmazonS3Client();
        }

        //UNUSED METHOD. WAS AN EXPERIMENT. IGNORE THIS.
        private static string GetSigV4URL(string pettype, string petid)
        {

            Console.WriteLine("PresignedUrlSample");

            // Construct a virtual hosted style address with the bucket name part of the host address,
            // placing the region into the url if we're not using us-east-1.
            // var regionUrlPart = string.Empty;
            // if (!string.IsNullOrEmpty(region))
            // {
            //     if (!region.Equals("us-east-1", StringComparison.OrdinalIgnoreCase))
            //         regionUrlPart = string.Format("-{0}", region);
            // }

            string GetFolderName()
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

            var endpointUri = string.Format("https://{0}.s3.amazonaws.com/{1}",
                                                _configuration["s3bucketname"],
                                               $"{GetFolderName()}/{petid}.jpg");

            Console.WriteLine($"EndPointUri : {endpointUri}");

            // var endpointUri = string.Format("https://{0}.s3{1}.amazonaws.com/{2}",
            //     bucketName,
            //     regionUrlPart,
            //     objectKey);

            // construct the query parameter string to accompany the url
            var queryParams = new StringBuilder();

            // for SignatureV4, the max expiry for a presigned url is 7 days, expressed
            // in seconds
            var expiresOn = DateTime.UtcNow.AddMinutes(5);
            var period = Convert.ToInt64((expiresOn.ToUniversalTime() - DateTime.UtcNow).TotalSeconds);
            queryParams.AppendFormat("{0}={1}", AWS4SignerBase.X_Amz_Expires, period.ToString());

            var headers = new Dictionary<string, string>();

            var signer = new AWS4SignerForQueryParameterAuth
            {
                EndpointUri = new Uri(endpointUri),
                HttpMethod = "GET",
                Service = "s3",
                Region = Environment.GetEnvironmentVariable("AWS_REGION")
            };

            var _httpClient = new HttpClient();

            Console.WriteLine($"AWS REGION : { Environment.GetEnvironmentVariable("AWS_REGION")}");

            Console.WriteLine($"Container Creds: {Environment.GetEnvironmentVariable("AWS_CONTAINER_CREDENTIALS_RELATIVE_URI")}");

           

            string containerCreds = _httpClient.GetStringAsync($"http://169.254.170.2{Environment.GetEnvironmentVariable("AWS_CONTAINER_CREDENTIALS_RELATIVE_URI")}").Result;

            
            Console.WriteLine($"containerCreds : {containerCreds}");

            var containerCredsObj = JsonSerializer.Deserialize<ContainerCreds>(containerCreds);

            Console.WriteLine($"AccessKey : {containerCredsObj.AccessKeyId}");
            Console.WriteLine($"SecretKey : {containerCredsObj.SecretAccessKey}");
            
            var authorization = signer.ComputeSignature(headers,
                                                        queryParams.ToString(),
                                                        "UNSIGNED-PAYLOAD",
                                                        containerCredsObj.AccessKeyId,
                                                        containerCredsObj.SecretAccessKey);

            // build the presigned url to incorporate the authorization element
            var urlBuilder = new StringBuilder(endpointUri.ToString());

            // add our query params
            urlBuilder.AppendFormat("?{0}", queryParams.ToString());

            // and finally the Signature V4 authorization string components
            urlBuilder.AppendFormat("&{0}", authorization);

            var presignedUrl = urlBuilder.ToString();

            Console.WriteLine("\nComputed presigned url:\n{0}", presignedUrl);

            return presignedUrl;
        }

        private static Func<string, string, string> GetPetURL = (pettype, petid) =>
        {
            AWSSDKHandler.RegisterXRay<IAmazonS3>();

            string _urlString;

            string GetFolderName()
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
                s3Client.EnsureBucketExistsAsync($"test-{_configuration["s3bucketname"]}");

                _urlString = s3Client.GetPreSignedURL(new GetPreSignedUrlRequest
                {
                    BucketName = _configuration["s3bucketname"],
                    Key = $"{GetFolderName()}/{petid}.jpg",
                    Expires = DateTime.Now.AddMinutes(5)
                });
            }
            catch (AmazonS3Exception e)
            {
                Console.WriteLine($"[{AWSXRayRecorder.Instance.GetEntity().TraceId}] - Error in accessing S3 bucket-{e.Message}");
                AWSXRayRecorder.Instance.AddException(e);
                throw e;
            }
            catch (Exception e)
            {
                Console.WriteLine($"[{AWSXRayRecorder.Instance.GetEntity().TraceId}] - Error-{e.Message}");
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

            Console.WriteLine($"[{AWSXRayRecorder.Instance.GetEntity().TraceId}] - {JsonSerializer.Serialize(Pets)}");

            return JsonSerializer.Serialize(Pets);
        };

        // Usage - GET: /api/search?pettype=puppy&petcolor=brown&petid=001
        [HttpGet]
        public async Task<string> Get([FromQuery] SearchParams searchParams)
        {
            try
            {
                AWSXRayRecorder.Instance.BeginSubsegment("Scanning DynamoDB Table");

                ScanFilter scanFilter = new ScanFilter();

                if (!String.IsNullOrEmpty(searchParams.petcolor)) scanFilter.AddCondition("petcolor", ScanOperator.Equal, searchParams.petcolor);
                if (!String.IsNullOrEmpty(searchParams.pettype)) scanFilter.AddCondition("pettype", ScanOperator.Equal, searchParams.pettype);
                if (!String.IsNullOrEmpty(searchParams.petid)) scanFilter.AddCondition("petid", ScanOperator.Equal, searchParams.petid);

                var scanquery = new ScanRequest
                {
                    TableName = _configuration["dynamodbtablename"],
                    ScanFilter = scanFilter.ToConditions()
                };

                // This line is intentional. Delays searches 
                if (!String.IsNullOrEmpty(searchParams.pettype) && searchParams.pettype == "bunny") Thread.Sleep(3000);


                AWSXRayRecorder.Instance.AddAnnotation("Query", $"petcolor:{searchParams.petcolor}-pettype:{searchParams.pettype}-petid:{searchParams.petid}");
                Console.WriteLine($"[{AWSXRayRecorder.Instance.GetEntity().TraceId}] - {searchParams}");

                var response = await ddbClient.ScanAsync(scanquery);
                AWSXRayRecorder.Instance.EndSubsegment();
                return BuildPets(response.Items);
            }
            catch (Exception e)
            {
                return e.Message;
            }
        }
    }
}
