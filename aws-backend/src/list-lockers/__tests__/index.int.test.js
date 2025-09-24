// index.int.test.js - Integration tests for listLockers Lambda handler

// Import the Lambda entry point (index.js)
const index = require("../index");

// Mock DynamoDB module so no real AWS calls are made
jest.mock("../dynamoDB", () => ({
  scanTable: jest.fn()
}));

const dynamoDb = require("../dynamoDB");

// Test suite for the Lambda handler, using an integration-style test
describe("listLockers Lambda handler (integration style)", () => {
  // Base event simulating an API Gateway request (claims not used yet)
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

  it("should return all lockers end-to-end (happy path)", async () => {
    // Arrange: DynamoDB returns two lockers
    const lockers = [
      { lockerId: "1234", ownerId: "user-abc", size: "large" },
      { lockerId: "5678", ownerId: "other-user", size: "small" }
    ];
    dynamoDb.scanTable.mockResolvedValue(lockers);

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.lockers).toEqual(lockers);
  });

  it("should return an empty list if no lockers exist", async () => {
    // Arrange: DynamoDB returns empty array
    dynamoDb.scanTable.mockResolvedValue([]);

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.lockers).toEqual([]);
  });

  it("should return 500 on unexpected errors", async () => {
    // Arrange: scanTable throws an unexpected error
    const error = new Error("DynamoDB down");
    dynamoDb.scanTable.mockRejectedValue(error);

    // Act
    const response = await index.handler(baseEvent);

    // Assert
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe("Internal Server Error");
  });
});
