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
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private static HttpClient _httpClient;
        private static Variety _variety = new Variety();

        private IConfiguration _configuration;

        public HomeController(ILogger<HomeController> logger, IConfiguration configuration)
        {
            _configuration = configuration;
            AWSSDKHandler.RegisterXRayForAllServices();

            _httpClient = new HttpClient(new HttpClientXRayTracingHandler(new HttpClientHandler()));
            _logger = logger;

            _variety.PetTypes = new List<SelectListItem>()
            {
                new SelectListItem() {Value = "all", Text = "All"},
                new SelectListItem() {Value = "puppy", Text = "Puppy"},
                new SelectListItem() {Value = "kitten", Text = "Kitten"},
                new SelectListItem() {Value = "bunny", Text = "Bunny"}
            };

            _variety.PetColors = new List<SelectListItem>()
            {
                new SelectListItem() {Value = "all", Text = "All"},
                new SelectListItem() {Value = "brown", Text = "Brown"},
                new SelectListItem() {Value = "black", Text = "Black"},
                new SelectListItem() {Value = "white", Text = "White"}
            };
        }

        private async Task<string> GetPetDetails(string pettype, string petcolor, string petid)
        {
            string searchUri = string.Empty;

            if (!String.IsNullOrEmpty(pettype) && pettype != "all") searchUri = $"pettype={pettype}";
            if (!String.IsNullOrEmpty(petcolor) && petcolor != "all") searchUri = $"&{searchUri}&petcolor={petcolor}";
            if (!String.IsNullOrEmpty(petid) && petid != "all") searchUri = $"&{searchUri}&petid={petid}";
            return await _httpClient.GetStringAsync($"{_configuration["searchapiurl"]}{searchUri}");
        }

        [HttpGet]
        public async Task<IActionResult> Index(string selectedPetType, string selectedPetColor, string petid)
        {
            AWSXRayRecorder.Instance.BeginSubsegment("Calling Search API");

            AWSXRayRecorder.Instance.AddMetadata("PetType", selectedPetType);
            AWSXRayRecorder.Instance.AddMetadata("PetId", petid);
            AWSXRayRecorder.Instance.AddMetadata("PetColor", selectedPetColor);

            Console.WriteLine(
                $" TraceId: [{AWSXRayRecorder.Instance.TraceContext.GetEntity().RootSegment.TraceId}] | SegmentId: [{AWSXRayRecorder.Instance.TraceContext.GetEntity().RootSegment.Id}]- Search string - PetType:{selectedPetType} PetColor:{selectedPetColor} PetId:{petid}");
            string result;

            try
            {
                result = await GetPetDetails(selectedPetType, selectedPetColor, petid);
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

            var Pets = JsonSerializer.Deserialize<List<Pet>>(result);

            var PetDetails = new PetDetails()
            {
                Pets = Pets,
                Varieties = new Variety
                {
                    PetTypes = _variety.PetTypes,
                    PetColors = _variety.PetColors,
                    SelectedPetColor = selectedPetColor,
                    SelectedPetType = selectedPetType
                }
            };
            AWSXRayRecorder.Instance.AddMetadata("results", PetDetails);
            Console.WriteLine(
                $" TraceId: [{AWSXRayRecorder.Instance.GetEntity().TraceId}] - {JsonSerializer.Serialize(PetDetails)}");

            return View(PetDetails);
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel {RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier});
        }
    }
}