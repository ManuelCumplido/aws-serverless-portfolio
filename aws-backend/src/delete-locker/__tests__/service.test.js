// service.test.js - Unit tests for deleteLocker in service.js

// Mock DynamoDB layer to avoid real AWS calls
jest.mock("../dynamoDB", () => ({
  getItem: jest.fn(),
  deleteItem: jest.fn()
}));

const dynamoDb = require("../dynamoDB");
const { deleteLocker } = require("../service");

describe("deleteLocker (unit tests)", () => {
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

  it("should delete a locker successfully", async () => {
    // Arrange: locker exists and owner matches
    dynamoDb.getItem.mockResolvedValue({
      Item: { lockerId: "1234", ownerId: "user-abc" }
    });
    dynamoDb.deleteItem.mockResolvedValue({});

    // Act
    const response = await deleteLocker(baseEvent);

    // Assert
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Locker deleted successfully");
    expect(body.locker).toBe("1234");
    expect(dynamoDb.deleteItem).toHaveBeenCalledTimes(1);
  });

  it("should return 404 if locker does not exist", async () => {
    // Arrange: DynamoDB getItem returns no Item
    dynamoDb.getItem.mockResolvedValue({});

    // Act
    const response = await deleteLocker(baseEvent);

    // Assert
    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Locker not found");
    expect(dynamoDb.deleteItem).not.toHaveBeenCalled();
  });

  it("should return 403 if user is not the owner", async () => {
    // Arrange: locker exists but ownerId does not match
    dynamoDb.getItem.mockResolvedValue({
      Item: { lockerId: "1234", ownerId: "other-user" }
    });

    // Act
    const response = await deleteLocker(baseEvent);

    // Assert
    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("You are not the owner of this locker");
    expect(dynamoDb.deleteItem).not.toHaveBeenCalled();
  });

  it("should return 404 if delete fails with ConditionalCheckFailedException", async () => {
    // Arrange: locker exists and owner matches, but DynamoDB deleteItem fails
    dynamoDb.getItem.mockResolvedValue({
      Item: { lockerId: "1234", ownerId: "user-abc" }
    });
    const error = new Error("not found");
    error.name = "ConditionalCheckFailedException";
    dynamoDb.deleteItem.mockRejectedValue(error);

    // Act
    const response = await deleteLocker(baseEvent);

    // Assert
    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Locker not found");
  });

  it("should throw unexpected errors", async () => {
    // Arrange: DynamoDB deleteItem fails with unknown error
    dynamoDb.getItem.mockResolvedValue({
      Item: { lockerId: "1234", ownerId: "user-abc" }
    });
    const error = new Error("DynamoDB down");
    dynamoDb.deleteItem.mockRejectedValue(error);

    // Act & Assert
    await expect(deleteLocker(baseEvent)).rejects.toThrow("DynamoDB down");
  });
});
