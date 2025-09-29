// service.test.js - Unit tests for updateLocker in service.js

// Mock DynamoDB layer to avoid real AWS calls
jest.mock("../dynamoDB", () => ({
  getItem: jest.fn(),
  updateItem: jest.fn()
}));

const dynamoDb = require("../dynamoDB");
const { updateLocker } = require("../service");

describe("updateLocker (unit tests)", () => {
  // Base event simulating an API Gateway request with Cognito claims + path parameter
  const baseEvent = {
    pathParameters: { id: "1234" },
    requestContext: {
      authorizer: {
        claims: { sub: "user-abc" }
      }
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

  it("should update a locker successfully", async () => {
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
    const response = await updateLocker(baseEvent);

    // Assert
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toEqual(updatedLocker);
    expect(dynamoDb.getItem).toHaveBeenCalledTimes(1);
    expect(dynamoDb.updateItem).toHaveBeenCalledTimes(1);
  });

  it("should return 403 if user is not the owner", async () => {
    // Arrange: locker exists but ownerId does not match
    dynamoDb.getItem.mockResolvedValue({
      Item: { lockerId: "1234", ownerId: "other-user" }
    });

    // Act
    const response = await updateLocker(baseEvent);

    // Assert
    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("You are not the owner of this locker");
    expect(dynamoDb.updateItem).not.toHaveBeenCalled();
  });

  it("should return 404 if update fails with ConditionalCheckFailedException", async () => {
    // Arrange: locker exists but DynamoDB updateItem fails
    dynamoDb.getItem.mockResolvedValue({
      Item: { lockerId: "1234", ownerId: "user-abc" }
    });
    const error = new Error("not found");
    error.name = "ConditionalCheckFailedException";
    dynamoDb.updateItem.mockRejectedValue(error);

    // Act
    const response = await updateLocker(baseEvent);

    // Assert
    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Locker not found");
  });

  it("should throw unexpected errors", async () => {
    // Arrange: DynamoDB updateItem throws unknown error
    dynamoDb.getItem.mockResolvedValue({
      Item: { lockerId: "1234", ownerId: "user-abc" }
    });
    const error = new Error("DynamoDB down");
    dynamoDb.updateItem.mockRejectedValue(error);

    // Act & Assert
    await expect(updateLocker(baseEvent)).rejects.toThrow("DynamoDB down");
  });
});
