// service.js - Business logic for managing lockers

const dynamoDb = require('./dynamoDB');

/**
 * Updates a locker in DynamoDB.
 * - lockerId comes from the path parameter {id}.
 * - ownerId comes from Cognito JWT claims.
 * - Returns 404 if the locker does not exist.
 */
async function updateLocker(event) {
    try {
        const body = JSON.parse(event.body);
        const lockerId = event.pathParameters.id;
        const ownerId = event.requestContext.authorizer.claims.sub;
        

        const updateLockerParams = {
            TableName: process.env.LOCKERS_TABLE,
            Key: { lockerId },
            UpdateExpression: "SET #st = :st, #loc = :loc, #sz = :sz",
            ExpressionAttributeNames: {
                "#st": "status",
                "#loc": "location",
                "#sz": "size",
            },
            ExpressionAttributeValues: {
                ":st": body.status,
                ":loc": body.location,
                ":sz": body.size,
            },
            ConditionExpression: "attribute_exists(lockerId)", // Prevent update if lockerId does not exist
            ReturnValues: "ALL_NEW", // Return the full item after update
        };

        const result = await dynamoDb.updateItem(updateLockerParams);

        return {
            statusCode: 200,
            body: JSON.stringify(result.Attributes),
        };
    } catch (error) {
        if (error.name === "ConditionalCheckFailedException") {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Locker not found" }),
            };
        }
        throw error; // unexpected errors handled in index.js
    }
}

module.exports = {
    updateLocker,
};