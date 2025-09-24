// index.int.test.js - Integration tests for updateLocker Lambda handler

// Import the Lambda entry point (index.js)
const index = require("../index");

// Mock DynamoDB module so no real AWS calls are made
jest.mock("../dynamoDB", () => ({
  getItem: jest.fn(),
  updateItem: jest.fn()
}));

const dynamoDb = require("../dynamoDB");

// Test suite for the Lambda handler, using an integration-style test
describe("updateLocker Lambda handler (integration style)", () => {
  // Base event simulating an API Gateway request with Cognito claims + path param + body
  const baseEvent = {
    pathParameters: { id: "1234" },
    requestContext: {
      authorizer: { claims: { sub: "user-abc" } }
    },
    body: JSON.stringify({
      status: "occupied",
      location: "Mexico",
      size: "large"
    })
  };

  // Reset all mocks after each test to avoid cross-test pollution
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should update a locker end-to-end (happy path)", async () => {
    // Arrange: locker exists and owner matches
    const updatedLocker = {
      lockerId: "1234",
      ownerId: "user-abc",
      status: "occupied",
      location: "Mexico",
      size: "large"
    };
    dynamoDb.getItem.mockResolvedValue({
      Item: { lockerId: "1234", ownerId: "user-abc" }
    });
    dynamoDb.updateItem.mockResolvedValue({ Attributes: updatedLocker });

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toEqual(updatedLocker);
  });

  it("should return 403 if user is not the owner", async () => {
    // Arrange: locker exists but owned by someone else
    dynamoDb.getItem.mockResolvedValue({
      Item: { lockerId: "1234", ownerId: "other-user" }
    });

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("You are not the owner of this locker");
  });

  it("should return 404 if update fails with ConditionalCheckFailedException", async () => {
    // Arrange: locker exists but update fails
    dynamoDb.getItem.mockResolvedValue({
      Item: { lockerId: "1234", ownerId: "user-abc" }
    });
    const error = new Error("not found");
    error.name = "ConditionalCheckFailedException";
    dynamoDb.updateItem.mockRejectedValue(error);

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Locker not found");
  });

  it("should return 500 on unexpected errors", async () => {
    // Arrange: updateItem throws unexpected error
    dynamoDb.getItem.mockResolvedValue({
      Item: { lockerId: "1234", ownerId: "user-abc" }
    });
    const error = new Error("DynamoDB down");
    dynamoDb.updateItem.mockRejectedValue(error);

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Internal Server Error");
  });
});
