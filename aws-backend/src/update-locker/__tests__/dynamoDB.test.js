// dynamoDB.test.js - Unit tests for dynamoDB.js (AWS SDK mocked)

// Mock AWS SDK clients
const mockSend = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn()
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: { from: jest.fn(() => ({ send: mockSend })) },
  UpdateCommand: jest.fn(),
  GetCommand: jest.fn()
}));

const { updateItem, getItem } = require("../dynamoDB");

describe("dynamoDB.js - updateItem & getItem", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- updateItem tests ---
  it("updateItem should return data when send succeeds (try path)", async () => {
    // Arrange
    const mockResult = { Attributes: { lockerId: "1234", status: "updated" } };
    mockSend.mockResolvedValue(mockResult);

    // Act
    const result = await updateItem({ TableName: "Lockers" });

    // Assert
    expect(result).toEqual(mockResult);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("updateItem should throw an error if send fails (catch path)", async () => {
    // Arrange
    const error = new Error("Update failed");
    mockSend.mockRejectedValue(error);

    // Act & Assert
    await expect(updateItem({ TableName: "Lockers" })).rejects.toThrow("Update failed");
  });

  // --- getItem tests ---
  it("getItem should return data when send succeeds (try path)", async () => {
    // Arrange
    const mockResult = { Item: { lockerId: "1234", status: "available" } };
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
