using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Amazon.XRay.Recorder.Core;
using Amazon.XRay.Recorder.Handlers.AwsSdk;
using Amazon.XRay.Recorder.Handlers.System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PetSite.ViewModels;

namespace PetSite.Controllers
{
    public class AdoptionController : Controller
    {
        private static readonly HttpClient _httpClient = new HttpClient(new HttpClientXRayTracingHandler(new HttpClientHandler()));
        private static Variety _variety = new Variety();

        public AdoptionController()
        {
            AWSSDKHandler.RegisterXRayForAllServices();
        }
        // GET: Adoption
        [HttpGet]
        public IActionResult Index([FromQuery] Pet pet)
        {
            return View(pet);
        }
        private async Task<string> GetPetDetails(SearchParams searchParams)
        {
            string searchUri = string.Empty;

            if (!String.IsNullOrEmpty(searchParams.pettype) && searchParams.pettype != "all") searchUri = $"pettype={searchParams.pettype}";
            if (!String.IsNullOrEmpty(searchParams.petcolor) && searchParams.petcolor != "all") searchUri = $"&{searchUri}&petcolor={searchParams.petcolor}";
            if (!String.IsNullOrEmpty(searchParams.petid) && searchParams.petid != "all") searchUri = $"&{searchUri}&petid={searchParams.petid}";

            return await _httpClient.GetStringAsync($"http://petsearch-prod.us-east-1.elasticbeanstalk.com/api/search?{searchUri}");
        }

        [HttpPost]
        public async Task<IActionResult> TakeMeHome([FromForm] SearchParams searchParams)
        {
            //String traceId = TraceId.NewId(); // This function is present in : Amazon.XRay.Recorder.Core.Internal.Entities
            AWSXRayRecorder.Instance
                .BeginSubsegment("Calling Search API"); // custom traceId used while creating segment
            string result;

            try
            {
                result = await GetPetDetails(searchParams);
            }
            catch (Exception e)
            {
                AWSXRayRecorder.Instance.AddException(e);
                throw e;
            }
            finally
            {
                AWSXRayRecorder.Instance.EndSubsegment();
            }

            return View("Index", JsonSerializer.Deserialize<List<Pet>>(result).FirstOrDefault());
        }
    }
}