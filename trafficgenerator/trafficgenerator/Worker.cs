using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace trafficgenerator
{
    public class Worker : BackgroundService
    {
        private readonly ILogger<Worker> _logger;

        private readonly string[] PetType = {"all", "puppy", "kitten", "bunny"};
        private readonly string[] PetColor = {"all", "brown", "black", "white"};
        private IConfiguration _configuration;
        private HttpClient _httpClient;

        public Worker(ILogger<Worker> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = new HttpClient();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("Worker running at: {time}", DateTimeOffset.Now);
                LoadPetData();
                await Task.Delay(1000, stoppingToken);
            }
        }

        private void LoadPetData()
        {
            var PetData = _httpClient.GetStringAsync(_configuration["searchapiurl"]).Result;
            Console.WriteLine(PetData);
        }
        private void GenerateTraffic()
        {
           // var petData = _httpClient.GetAsync("http://petsearch-prod.us-east-1.elasticbeanstalk.com/api/search?")
        }
    }
}