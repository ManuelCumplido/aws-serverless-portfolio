// dynamoDB.js - Data access layer for DynamoDB (uses AWS SDK v3)

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);

async function updateItem(params) {
    try {
        return await ddbDocClient.send(new UpdateCommand(params));
    } catch (error) {
        throw error;
    }
}

async function getItem(params) {
    try {
        return await ddbDocClient.send(new GetCommand(params));
    } catch (error) {
        throw error;
    }
}

module.exports = {
    updateItem,
    getItem,
};
