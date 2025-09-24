// index.int.test.js - Integration tests for index.js handler

// Import the Lambda entry point (index.js)
const index = require("../index");

// Mock DynamoDB module so no real AWS calls are made
jest.mock("../dynamoDB", () => ({
  putItems: jest.fn()
}));

const dynamoDb = require("../dynamoDB");

// Test suite for the Lambda handler, using an integration-style test
describe("createLocker Lambda handler (integration style)", () => {
  // Base event simulating an API Gateway request with Cognito claims
  const baseEvent = {
    body: JSON.stringify({
      uuid: "1234",
      location: "Mexico",
      size: "large"
    }),
    requestContext: {
      authorizer: {
        claims: {
          sub: "user-abc",
          "cognito:username": "Mr. X"
        }
      }
    }
  };

  // Reset all mocks after each test to avoid cross-test pollution
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a locker end-to-end (happy path)", async () => {
    // Arrange: DynamoDB call resolves successfully
    dynamoDb.putItems.mockResolvedValue({});

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Locker created successfully");
    expect(body.locker.lockerId).toBe("1234");
  });

  it("should return 409 when locker already exists", async () => {
    // Arrange: DynamoDB rejects with ConditionalCheckFailedException
    const error = new Error("exists");
    error.name = "ConditionalCheckFailedException";
    dynamoDb.putItems.mockRejectedValue(error);

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(409);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Locker already exists");
  });

  it("should return 500 on unexpected errors", async () => {
    // Arrange: DynamoDB rejects with an unexpected error
    const error = new Error("DynamoDB down");
    dynamoDb.putItems.mockRejectedValue(error);

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Internal Server Error");
  });
});
