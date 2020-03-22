'use strict';

var AWSXRay = require('aws-xray-sdk');
var AWS = AWSXRay.captureAWS(require('aws-sdk'));
var documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = function (event, context, callback) {
    var params = {
        TableName: process.env.TABLE_NAME,
        Key: {
            "pettype": event.pettype,
            "petid": event.petid
        },
        UpdateExpression: "set availability = :r",
        ExpressionAttributeValues: {
            ":r": "no"
        }, ReturnValues: "UPDATED_NEW"
    };

    documentClient.update(params, function (err, data) {
        if (err) {
            console.log(JSON.stringify(err, null, 2));
        } else {
            console.log(JSON.stringify(data, null, 2));
        }
    }).promise();
}

