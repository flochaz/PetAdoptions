using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PetSearch
{
    public class ContainerCreds
    {
        public string AccessKeyId { get; set; }
        public string Expiration { get; set; }
        public string RoleArn { get; set; }
        public string SecretAccessKey { get; set; }
        public string Token { get; set; }
    }
}
