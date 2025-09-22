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
        const ownerIdBody = event.requestContext.authorizer.claims.sub;

        const getLockerParams = {
            TableName: process.env.LOCKERS_TABLE,
            Key: { lockerId },
        };

        const { Item: locker } = await dynamoDb.getItem(getLockerParams);

        if (!locker) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Locker not found" }),
            };
        }

        const ownerIdDB = locker.ownerId;

        if (ownerIdBody !== ownerIdDB) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: "You are not the owner of this locker" }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(locker),
        };
    } catch (error) {
        throw error; // unexpected errors handled in index.js
    }
}

module.exports = {
    getLocker,
};
