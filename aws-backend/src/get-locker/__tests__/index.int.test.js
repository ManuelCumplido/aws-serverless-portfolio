// index.int.test.js - Integration tests for getLocker Lambda handler

// Import the Lambda entry point (index.js)
const index = require("../index");

// Mock DynamoDB module so no real AWS calls are made
jest.mock("../dynamoDB", () => ({
  getItem: jest.fn()
}));

const dynamoDb = require("../dynamoDB");

// Test suite for the Lambda handler, using an integration-style test
describe("getLocker Lambda handler (integration style)", () => {
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

  it("should return locker data end-to-end (happy path)", async () => {
    // Arrange: locker exists and owner matches
    const locker = { lockerId: "1234", ownerId: "user-abc", size: "large" };
    dynamoDb.getItem.mockResolvedValue({ Item: locker });

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toEqual(locker);
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
    const locker = { lockerId: "1234", ownerId: "other-user" };
    dynamoDb.getItem.mockResolvedValue({ Item: locker });

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("You are not the owner of this locker");
  });

  it("should return 500 on unexpected errors", async () => {
    // Arrange: getItem throws an unexpected error
    const error = new Error("DynamoDB down");
    dynamoDb.getItem.mockRejectedValue(error);

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Internal Server Error");
  });
});
