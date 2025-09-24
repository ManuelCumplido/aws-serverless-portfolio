// service.test.js - Unit tests for getLocker in service.js

// Mock DynamoDB layer to avoid real AWS calls
jest.mock("../dynamoDB", () => ({
  getItem: jest.fn()
}));

const dynamoDb = require("../dynamoDB");
const { getLocker } = require("../service");

describe("getLocker (unit tests)", () => {
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

  it("should return the locker if it exists and user is the owner", async () => {
    // Arrange: locker exists and owner matches
    const locker = { lockerId: "1234", ownerId: "user-abc", size: "large" };
    dynamoDb.getItem.mockResolvedValue({ Item: locker });

    // Act
    const response = await getLocker(baseEvent);

    // Assert
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toEqual(locker);
    expect(dynamoDb.getItem).toHaveBeenCalledTimes(1);
  });

  it("should return 404 if locker does not exist", async () => {
    // Arrange: DynamoDB getItem returns no Item
    dynamoDb.getItem.mockResolvedValue({});

    // Act
    const response = await getLocker(baseEvent);

    // Assert
    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Locker not found");
    expect(dynamoDb.getItem).toHaveBeenCalledTimes(1);
  });

  it("should return 403 if user is not the owner", async () => {
    // Arrange: locker exists but ownerId does not match
    const locker = { lockerId: "1234", ownerId: "other-user" };
    dynamoDb.getItem.mockResolvedValue({ Item: locker });

    // Act
    const response = await getLocker(baseEvent);

    // Assert
    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("You are not the owner of this locker");
    expect(dynamoDb.getItem).toHaveBeenCalledTimes(1);
  });

  it("should throw unexpected errors", async () => {
    // Arrange: DynamoDB getItem throws an unknown error
    const error = new Error("DynamoDB down");
    dynamoDb.getItem.mockRejectedValue(error);

    // Act & Assert
    await expect(getLocker(baseEvent)).rejects.toThrow("DynamoDB down");
  });
});
