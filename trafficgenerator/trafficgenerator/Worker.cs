using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace trafficgenerator
{
    public class Worker : BackgroundService
    {
        private readonly ILogger<Worker> _logger;

        private readonly string[] PetType = {"all", "puppy", "kitten", "bunny"};
        private readonly string[] PetColor = {"all", "brown", "black", "white"};
        private IConfiguration _configuration;
        private HttpClient _httpClient;
        private List<Pet> _allPets;
        private string _petSiteUrl;
        private string _petSearchUrl;

        public Worker(ILogger<Worker> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = new HttpClient();
            _petSiteUrl = $"http://{_configuration["petsiteurl"]}";
            _petSearchUrl = $"http://{_configuration["searchapiurl"]}";
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("Worker running at: {time}", DateTimeOffset.Now);
                    LoadPetData();
                    await ThrowSomeSearchTraffic();
                    await Task.Delay(20000, stoppingToken);
                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                    await Task.Delay(100000, stoppingToken);
                }
            }
        }

        private void LoadPetData()
        {
            var petData = _httpClient.GetStringAsync($"{_petSearchUrl}").Result;
            _allPets = JsonSerializer.Deserialize<List<Pet>>(petData);
        }

        private async Task ThrowSomeSearchTraffic()
        {
            Random random = new Random();
            var loadSize = random.Next(5, _allPets.Count);

            for (int i = 0; i < loadSize; i++)
            {
                var currentPet = _allPets[random.Next(0, _allPets.Count - 1)];

                await _httpClient.GetAsync(
                    $"{_petSiteUrl}/?selectedPetType={currentPet.pettype}&selectedPetColor={currentPet.petcolor}");

                await _httpClient.PostAsync($"{_petSiteUrl}/Adoption/TakeMeHome",
                    new StringContent(
                        $"pettype={currentPet.pettype}&" +
                        $"petcolor={currentPet.petcolor}&" +
                        $"petid={currentPet.petid}",
                        Encoding.Default, "application/x-www-form-urlencoded"));

                await _httpClient.PostAsync($"{_petSiteUrl}/Payment/MakePayment",
                    new StringContent(
                        $"pettype={currentPet.pettype}&" +
                        $"petid={currentPet.petid}",
                        Encoding.Default, "application/x-www-form-urlencoded"));

                var res = _httpClient.GetAsync(
                    $"{_petSiteUrl}/PetListAdoptions").Result;
            }

            var res2 = _httpClient.GetAsync(
                $"{_petSiteUrl}/housekeeping/").Result;
        }

        private void GenerateTraffic()
        {
            // var petData = _httpClient.GetAsync("http://petsearch-prod.us-east-1.elasticbeanstalk.com/api/search?")
        }
    }
}