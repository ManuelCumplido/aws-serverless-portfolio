// dynamoDB.test.js - Unit tests for dynamoDB.js (AWS SDK mocked)

// Mock AWS SDK clients
const mockSend = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn()
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: { from: jest.fn(() => ({ send: mockSend })) },
  ScanCommand: jest.fn()
}));

const { scanTable } = require("../dynamoDB");

describe("dynamoDB.js - scanTable", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return items when send succeeds (try path)", async () => {
    // Arrange
    const mockResult = { Items: [{ lockerId: "1234" }, { lockerId: "5678" }] };
    mockSend.mockResolvedValue(mockResult);

    // Act
    const result = await scanTable({ TableName: "Lockers" });

    // Assert
    expect(result).toEqual(mockResult.Items);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if send fails (catch path)", async () => {
    // Arrange
    const error = new Error("Scan failed");
    mockSend.mockRejectedValue(error);

    // Act & Assert
    await expect(scanTable({ TableName: "Lockers" })).rejects.toThrow("Scan failed");
  });
});
