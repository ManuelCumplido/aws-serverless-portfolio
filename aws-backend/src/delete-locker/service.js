// service.js - Business logic for managing lockers

const dynamoDb = require('./dynamoDB');

/**
 * Deletes locker in DynamoDB.
 * - lockerId comes from the path parameter {id}.
 * - ownerId comes from Cognito JWT claims.
 * - Prevents deleting non-existing locker via ConditionExpression.
 */
async function deleteLocker(event) {
    try {

        const body = JSON.parse(event.body);
        const lockerId = event.pathParameters.id
        const ownerId = event.requestContext.authorizer.claims.sub;

        const deleteLockerParams = {
            TableName: process.env.LOCKERS_TABLE,
            Key: {
                lockerId: lockerId,
            },
            ConditionExpression: "attribute_exists(lockerId)", // Prevent delete if lockerId does not exist
        };

        await dynamoDb.deleteItem(deleteLockerParams);


        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "Locker deleted successfully",
                locker: newLockerItem
            }),
        }

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
    deleteLocker,
}
