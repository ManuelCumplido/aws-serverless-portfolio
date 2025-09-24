// service.test.js - Unit tests for service.js

// Mock DynamoDB layer to avoid real AWS calls
jest.mock("../dynamoDB", () => ({
  putItems: jest.fn()
}));

const dynamoDb = require("../dynamoDB");
const { createLocker } = require("../service");

describe("createLocker (unit tests)", () => {
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

  it("should create a locker successfully", async () => {
    // Arrange: DynamoDB call resolves successfully
    dynamoDb.putItems.mockResolvedValue({});

    // Act: call the business logic with a valid event
    const response = await createLocker(baseEvent);

    // Assert: validate the response structure and DynamoDB interaction
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Locker created successfully");
    expect(body.locker.lockerId).toBe("1234");
    expect(dynamoDb.putItems).toHaveBeenCalledTimes(1);
  });

  it("should return 409 if locker already exists", async () => {
    // Arrange: DynamoDB throws a ConditionalCheckFailedException
    const error = new Error("exists");
    error.name = "ConditionalCheckFailedException";
    dynamoDb.putItems.mockRejectedValue(error);

    // Act: call the business logic with a duplicate locker
    const response = await createLocker(baseEvent);

    // Assert: service responds with 409 Conflict
    expect(response.statusCode).toBe(409);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Locker already exists");
  });

  it("should throw unexpected errors", async () => {
    // Arrange: DynamoDB throws an unexpected error
    const error = new Error("DynamoDB down");
    dynamoDb.putItems.mockRejectedValue(error);

    // Act & Assert: service should propagate the error
    await expect(createLocker(baseEvent)).rejects.toThrow("DynamoDB down");
  });
});
