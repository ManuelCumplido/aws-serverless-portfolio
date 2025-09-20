// dynamoDB.js - Data access layer for DynamoDB (uses AWS SDK v3)

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);

async function scanTable(params) {
    try {

        const data = await ddbDocClient.send(new ScanCommand(params));
        return data.Items;

    } catch (error) {
        throw error;
    }
}

module.exports = {
  scanTable,
};
