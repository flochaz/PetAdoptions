using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore;
using Prometheus.DotNetRuntime;

namespace PetSite
{
    public class Program
    {
        public static void Main(string[] args)
        {
            // Sets default settings to collect dotnet runtime specific metrics
            DotNetRuntimeStatsBuilder.Default().StartCollecting();
            
            //You can also set the specifics on what metrics you want to collect as below
            // DotNetRuntimeStatsBuilder.Customize()
            //     .WithThreadPoolSchedulingStats()
            //     .WithContentionStats()
            //     .WithGcStats()
            //     .WithJitStats()
            //     .WithThreadPoolStats()
            //     .WithErrorHandler(ex => Console.WriteLine("ERROR: " + ex.ToString()))
            //     //.WithDebuggingMetrics(true);
            //     .StartCollecting();
            
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder => { webBuilder.UseStartup<Startup>(); })
                .ConfigureAppConfiguration(config => { config.AddSystemsManager("/petstore"); });
    }
}