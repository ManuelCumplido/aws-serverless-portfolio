import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

export const updateLocker = async (event) => {
  const lockerId = event.pathParameters.id;
  const body = JSON.parse(event.body);

  const params = {
    TableName: process.env.lockersTableName,
    Key: { lockerId },
    UpdateExpression: "SET #st = :st, #loc = :loc, #sz = :sz",
    ExpressionAttributeNames: {
      "#st": "status",
      "#loc": "location",
      "#sz": "size"
    },
    ExpressionAttributeValues: {
      ":st": body.status,
      ":loc": body.location,
      ":sz": body.size
    },
    ConditionExpression: "attribute_exists(lockerId)",
    ReturnValues: "ALL_NEW"
  };

  try {
    const result = await ddbDocClient.send(new UpdateCommand(params));
    return { statusCode: 200, body: JSON.stringify(result.Attributes) };
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return { statusCode: 404, body: JSON.stringify({ message: "Locker not found" }) };
    }
    throw err;
  }
};
