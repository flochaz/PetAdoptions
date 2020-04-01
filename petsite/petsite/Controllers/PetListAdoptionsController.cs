using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PetSite.Models;

using Amazon.XRay.Recorder.Handlers.AwsSdk;
using System.Net.Http;
using Amazon.XRay.Recorder.Handlers.System.Net;
using Amazon.XRay.Recorder.Core;
using System.Text.Json;
using PetSite.ViewModels;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Extensions.Configuration;

namespace PetSite.Controllers
{
    public class PetListAdoptionsController : Controller
    {
        private static HttpClient _httpClient;
        private IConfiguration _configuration;


        public PetListAdoptionsController(IConfiguration configuration)
        {
            _configuration = configuration;
            AWSSDKHandler.RegisterXRayForAllServices();

            _httpClient   = new HttpClient(new HttpClientXRayTracingHandler(new HttpClientHandler()));
        }
        // GET
        public async Task<IActionResult> Index()
        {
            AWSXRayRecorder.Instance.BeginSubsegment("Calling Search API"); 
           
            string result;

            List<Pet> Pets = new List<Pet>();

            try
            {
                Console.WriteLine("About to call PetListadoptions");
                // result=  await _httpClient.GetStringAsync($"{_configuration["petlistadoptionsurl"]}");
                result=  await _httpClient.GetStringAsync($"http://PetListAdoptions-156515356.us-east-1.elb.amazonaws.com/api/adoptionlist");
                 Pets = JsonSerializer.Deserialize<List<Pet>>(result);
                 Console.WriteLine("out of PetListadoptions :" + Pets.Count.ToString());

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

            return View(Pets);
        }
    }
}