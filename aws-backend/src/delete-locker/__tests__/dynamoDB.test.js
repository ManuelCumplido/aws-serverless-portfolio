// dynamoDB.test.js - Unit tests for dynamoDB.js (AWS SDK mocked)

// Mock AWS SDK clients
const mockSend = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn()
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: { from: jest.fn(() => ({ send: mockSend })) },
  DeleteCommand: jest.fn(),
  GetCommand: jest.fn()
}));

const { deleteItem, getItem } = require("../dynamoDB");

describe("dynamoDB.js", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- deleteItem tests ---
  it("deleteItem should call send successfully (try path)", async () => {
    // Arrange
    mockSend.mockResolvedValue({});

    // Act & Assert
    await expect(deleteItem({ TableName: "Lockers" })).resolves.not.toThrow();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("deleteItem should throw an error if send fails (catch path)", async () => {
    // Arrange
    const error = new Error("Delete failed");
    mockSend.mockRejectedValue(error);

    // Act & Assert
    await expect(deleteItem({ TableName: "Lockers" })).rejects.toThrow("Delete failed");
  });

  // --- getItem tests ---
  it("getItem should return data when send succeeds (try path)", async () => {
    // Arrange
    const mockResult = { Item: { lockerId: "1234" } };
    mockSend.mockResolvedValue(mockResult);

    // Act
    const result = await getItem({ TableName: "Lockers" });

    // Assert
    expect(result).toEqual(mockResult);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("getItem should throw an error if send fails (catch path)", async () => {
    // Arrange
    const error = new Error("Get failed");
    mockSend.mockRejectedValue(error);

    // Act & Assert
    await expect(getItem({ TableName: "Lockers" })).rejects.toThrow("Get failed");
  });
});
