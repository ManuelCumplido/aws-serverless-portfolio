// index.int.test.js - Integration tests for deleteLocker Lambda handler

// Import the Lambda entry point (index.js)
const index = require("../index");

// Mock DynamoDB module so no real AWS calls are made
jest.mock("../dynamoDB", () => ({
  getItem: jest.fn(),
  deleteItem: jest.fn()
}));

const dynamoDb = require("../dynamoDB");

// Test suite for the Lambda handler, using an integration-style test
describe("deleteLocker Lambda handler (integration style)", () => {
  // Base event simulating an API Gateway request with Cognito claims + path parameter
  const baseEvent = {
    pathParameters: { id: "1234" },
    requestContext: {
      authorizer: {
        claims: { sub: "user-abc" }
      }
    }
  };

  // Reset all mocks after each test to avoid cross-test pollution
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should delete a locker end-to-end (happy path)", async () => {
    // Arrange: locker exists and owner matches
    dynamoDb.getItem.mockResolvedValue({
      Item: { lockerId: "1234", ownerId: "user-abc" }
    });
    dynamoDb.deleteItem.mockResolvedValue({});

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Locker deleted successfully");
    expect(body.locker).toBe("1234");
  });

  it("should return 404 if locker not found", async () => {
    // Arrange: getItem returns no Item
    dynamoDb.getItem.mockResolvedValue({});

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Locker not found");
  });

  it("should return 403 if user is not the owner", async () => {
    // Arrange: locker exists but with different owner
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

  it("should return 404 if deleteItem fails with ConditionalCheckFailedException", async () => {
    // Arrange: locker exists but delete fails
    dynamoDb.getItem.mockResolvedValue({
      Item: { lockerId: "1234", ownerId: "user-abc" }
    });
    const error = new Error("not found");
    error.name = "ConditionalCheckFailedException";
    dynamoDb.deleteItem.mockRejectedValue(error);

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Locker not found");
  });

  it("should return 500 on unexpected errors", async () => {
    // Arrange: deleteItem throws an unexpected error
    dynamoDb.getItem.mockResolvedValue({
      Item: { lockerId: "1234", ownerId: "user-abc" }
    });
    const error = new Error("DynamoDB down");
    dynamoDb.deleteItem.mockRejectedValue(error);

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Internal Server Error");
  });
});
