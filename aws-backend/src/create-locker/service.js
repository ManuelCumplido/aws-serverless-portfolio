// service.js - Business logic for managing lockers

const dynamoDb = require('./dynamoDB');

/**
 * Creates a new locker in DynamoDB.
 * - lockerId comes from device UUID (provided in request body).
 * - ownerId and userName come from Cognito JWT claims.
 * - Prevents overwriting existing lockers via ConditionExpression.
 */
async function createLocker(event) {
    try {

        const body = JSON.parse(event.body);
        const uuid = body.uuid;
        const location = body.location;
        const size = body.size;
        const ownerId = event.requestContext.authorizer.claims.sub;
        const userName = event.requestContext.authorizer.claims["cognito:username"];

        const newLockerItem = {
            "lockerId": uuid,
            "userName": userName,
            "ownerId": ownerId,
            "status": "available", // default value
            "createdAt": new Date().toISOString(),
            "location": location,
            "size": size
        }

        const newLockerParams = {
            TableName: process.env.LOCKERS_TABLE,
            Item: newLockerItem,
            ConditionExpression: "attribute_not_exists(lockerId)", // prevent overwrite
        }

        await dynamoDb.putItems(newLockerParams);

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: "Locker created successfully",
                locker: newLockerItem
            }),
        }

    } catch (error) {
        if (error.name === "ConditionalCheckFailedException") {
          return {
            statusCode: 409,
            body: JSON.stringify({ message: "Locker already exists" }),
          };
        }
        throw error;
      }
}

module.exports ={
    createLocker,
}
