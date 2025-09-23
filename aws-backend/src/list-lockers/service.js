const dynamoDb = require("./dynamoDB");

/**
 * List all lockers (optionally filter by ownerId in future)
 */
async function listLockers(event) {
  try {
    // Opción futura: usar claims para filtrar por ownerId
    //const ownerId = event.requestContext.authorizer.claims.sub;

    const params = {
      TableName: process.env.LOCKERS_TABLE,
    };

    const lockers = await dynamoDb.scanTable(params);

    return {
      statusCode: 200,
      body: JSON.stringify({ lockers }),
    };
  } catch (error) {
    throw error; // unexpected errors handled in index.js
  }
}

module.exports = {
  listLockers,
};
