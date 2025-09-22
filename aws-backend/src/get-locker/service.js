// service.js - Business logic for managing lockers

const dynamoDb = require('./dynamoDB');

/**
 * Get locker in DynamoDB.
 * - lockerId comes from the path parameter {id}.
 * - ownerId comes from Cognito JWT claims.
 * - Returns 404 if the locker does not exist.
 */
async function getLocker(event) {
    try {
        const lockerId = event.pathParameters.id;
        const ownerId = event.requestContext.authorizer.claims.sub;

        const getLockerParams = {
            TableName: process.env.LOCKERS_TABLE,
            Key: { lockerId },
        };

        const result = await dynamoDb.getItem(getLockerParams);

        if (!result.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Locker not found" }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(result.Item),
        };
    } catch (error) {
        throw error; // unexpected errors handled in index.js
    }
}

module.exports = {
    getLocker,
};
