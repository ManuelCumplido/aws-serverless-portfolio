// service.test.js - Unit tests for listLockers in service.js

// Mock DynamoDB layer to avoid real AWS calls
jest.mock("../dynamoDB", () => ({
  scanTable: jest.fn()
}));

const dynamoDb = require("../dynamoDB");
const { listLockers } = require("../service");

describe("listLockers (unit tests)", () => {
  // Base event simulating an API Gateway request (could hold claims in future)
  const baseEvent = {
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

  it("should return all lockers successfully", async () => {
    // Arrange: mock DynamoDB scanTable returning two lockers
    const mockLockers = [
      { lockerId: "1234", ownerId: "user-abc" },
      { lockerId: "5678", ownerId: "other-user" }
    ];
    dynamoDb.scanTable.mockResolvedValue(mockLockers);

    // Act
    const response = await listLockers(baseEvent);

    // Assert
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.lockers).toEqual(mockLockers);
    expect(dynamoDb.scanTable).toHaveBeenCalledTimes(1);
    expect(dynamoDb.scanTable).toHaveBeenCalledWith({
      TableName: process.env.LOCKERS_TABLE
    });
  });

  it("should throw unexpected errors", async () => {
    // Arrange: DynamoDB scanTable throws
    const error = new Error("DynamoDB down");
    dynamoDb.scanTable.mockRejectedValue(error);

    // Act & Assert
    await expect(listLockers(baseEvent)).rejects.toThrow("DynamoDB down");
  });
});
