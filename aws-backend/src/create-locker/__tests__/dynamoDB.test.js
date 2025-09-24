// dynamoDB.test.js - Unit tests for dynamoDB.js (AWS SDK mocked)

// Mock AWS SDK clients
const mockSend = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn()
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: { from: jest.fn(() => ({ send: mockSend })) },
  PutCommand: jest.fn()
}));

const { putItems } = require("../dynamoDB");

describe("dynamoDB.js", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call send successfully (try path)", async () => {
    // Arrange: mock successful response
    mockSend.mockResolvedValue({});

    // Act & Assert
    await expect(putItems({ TableName: "Lockers" })).resolves.not.toThrow();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if send fails (catch path)", async () => {
    // Arrange: mock rejection
    const error = new Error("DynamoDB down");
    mockSend.mockRejectedValue(error);

    // Act & Assert
    await expect(putItems({ TableName: "Lockers" })).rejects.toThrow("DynamoDB down");
  });
});
