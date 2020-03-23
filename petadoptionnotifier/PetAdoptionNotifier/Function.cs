using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using Amazon.Lambda.Core;
using Amazon.SQS.Model;
using Amazon.SQS;
using Amazon.XRay.Model;
using Amazon.XRay.Model.Internal;
using Amazon.XRay.Recorder.Core.Internal.Entities;
using Amazon.XRay.Recorder.Core;
using Amazon.XRay.Recorder.Handlers;
using Amazon.XRay;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace PetAdoptionNotifier
{
    public class Function
    {

        private static AmazonSQSClient _sqsClient = new AmazonSQSClient();
        private static AmazonXRayClient _xrayClient = new AmazonXRayClient();
        /// <summary>
        /// A simple function that takes a string and does a ToUpper
        /// </summary>
        /// <param name="input"></param>
        /// <param name="context"></param>
        /// <returns></returns>
        public void FunctionHandler(object input, ILambdaContext context)
        {
            Console.WriteLine("Inside Function");
            ReceiveMessageRequest messageRequest = new ReceiveMessageRequest("https://sqs.us-east-1.amazonaws.com/831210339789/PetAdoptions")
            {
                AttributeNames = { "AWSTraceHeader" }
            };

            var messages = _sqsClient.ReceiveMessageAsync(messageRequest).Result;

            Console.WriteLine("Received Messages");

            foreach (var message in messages.Messages)
            {

                Console.WriteLine($"Message BODY: {message.Body}");
                // MessageAttributeValue traceHeaderStr = message.MessageAttributes["AWSTraceHeader"];

                Console.WriteLine($"COUNT OF HEADERS :{ message.MessageAttributes.Count}");
                foreach(var header in message.MessageAttributes)
                {
                    Console.WriteLine($"Key :{header.Key}  --  Value :{header.Value}");
                }

                //if (traceHeaderStr != null)
                //{
                //    TraceHeader traceHeader = TraceHeader.FromString(traceHeaderStr.StringValue);

                //    // Recover the trace context from the trace header


                //    Amazon.XRay.Recorder.Core.Internal.Entities.Segment segment = AWSXRayRecorder.Instance.GetEntity().RootSegment;
                //    segment.TraceId = traceHeader.RootTraceId;
                //    segment.ParentId = traceHeader.ParentId;
                //    segment.Sampled = traceHeader.Sampled;
                //}
            }
            Console.WriteLine("Out of For loop");
        }
    }
}
