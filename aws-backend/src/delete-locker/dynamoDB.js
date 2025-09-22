// dynamoDB.js - Data access layer for DynamoDB (uses AWS SDK v3)

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);


async function deleteItem(params) {
    try {
        await ddbDocClient.send(new DeleteCommand(params));
    } catch (error) {
        throw error;
    }
}

module.exports = {
    deleteItem,
};

