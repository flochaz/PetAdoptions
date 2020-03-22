using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

using Microsoft.AspNetCore;

namespace PetSite
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseStartup<Startup>();
            });
        //Host.CreateDefaultBuilder(args)
        //    .ConfigureAppConfiguration((context, config) =>
        //    {
        //        var env = context.HostingEnvironment;

        //        // NOTE: A default AWS SDK configuration has been added to appsettings.Development.json.
        //        // More Details can be found at: https://docs.aws.amazon.com/sdk-for-net/v3/developer-guide/net-dg-config-netcore.html

        //        // Add systems manager parameter store paths
        //        config.AddSystemsManager($"/dotnet-aws-samples/systems-manager-sample/common");
        //        config.AddSystemsManager($"/dotnet-aws-samples/systems-manager-sample/{env.EnvironmentName}", optional: true);
        //    }).CreateDefaultBuilder(args)
        //    .ConfigureWebHostDefaults(webBuilder =>
        //    {
        //        webBuilder.UseStartup<Startup>();
        //    });
    }
}
