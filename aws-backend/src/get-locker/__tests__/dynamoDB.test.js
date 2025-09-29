// dynamoDB.test.js - Unit tests for dynamoDB.js (AWS SDK mocked)

// Mock AWS SDK clients
const mockSend = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn()
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: { from: jest.fn(() => ({ send: mockSend })) },
  GetCommand: jest.fn()
}));

const { getItem } = require("../dynamoDB");

describe("dynamoDB.js - getItem", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return data when send succeeds (try path)", async () => {
    // Arrange
    const mockResult = { Item: { lockerId: "1234" } };
    mockSend.mockResolvedValue(mockResult);

    // Act
    const result = await getItem({ TableName: "Lockers" });

    // Assert
    expect(result).toEqual(mockResult);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if send fails (catch path)", async () => {
    // Arrange
    const error = new Error("Get failed");
    mockSend.mockRejectedValue(error);

    // Act & Assert
    await expect(getItem({ TableName: "Lockers" })).rejects.toThrow("Get failed");
  });
});
