// lockers.integration.test.js - Integration tests for the Locker domain

// Import all Lambda entry points
const createLocker = require("../src/create-locker/index");
const deleteLocker = require("../src/delete-locker/index");
const getLocker = require("../src/get-locker/index");
const listLockers = require("../src/list-lockers/index");
const updateLocker = require("../src/update-locker/index");

// Mock DynamoDB modules so no real AWS calls are made
jest.mock("../src/create-locker/dynamoDB", () => ({ putItems: jest.fn() }));
jest.mock("../src/delete-locker/dynamoDB", () => ({ getItem: jest.fn(), deleteItem: jest.fn() }));
jest.mock("../src/get-locker/dynamoDB", () => ({ getItem: jest.fn() }));
jest.mock("../src/list-lockers/dynamoDB", () => ({ scanTable: jest.fn() }));
jest.mock("../src/update-locker/dynamoDB", () => ({ getItem: jest.fn(), updateItem: jest.fn() }));

const createDb = require("../src/create-locker/dynamoDB");
const deleteDb = require("../src/delete-locker/dynamoDB");
const getDb = require("../src/get-locker/dynamoDB");
const listDb = require("../src/list-lockers/dynamoDB");
const updateDb = require("../src/update-locker/dynamoDB");

// Base data
const lockerId = "1234";
const userId = "user-abc";
const otherUser = "other-user";
const baseClaims = { sub: userId, "cognito:username": "Mr. X" };

describe("Lockers CRUD Integration", () => {
  afterEach(() => jest.clearAllMocks());

  // ------------------------
  // FULL CRUD FLOW (Happy Path)
  // ------------------------
  it("should perform full Locker CRUD flow successfully", async () => {
    // 1. CREATE
    createDb.putItems.mockResolvedValue({});
    const createEvent = {
      body: JSON.stringify({ uuid: lockerId, location: "Mexico", size: "large" }),
      requestContext: { authorizer: { claims: baseClaims } },
    };
    const createRes = await createLocker.handler(createEvent);
    expect(createRes.statusCode).toBe(201);

    // 2. GET
    const locker = { lockerId, ownerId: userId, size: "large" };
    getDb.getItem.mockResolvedValue({ Item: locker });
    const getEvent = {
      pathParameters: { id: lockerId },
      requestContext: { authorizer: { claims: baseClaims } },
    };
    const getRes = await getLocker.handler(getEvent);
    expect(getRes.statusCode).toBe(200);

    // 3. UPDATE
    const updated = { ...locker, status: "occupied" };
    updateDb.getItem.mockResolvedValue({ Item: locker });
    updateDb.updateItem.mockResolvedValue({ Attributes: updated });
    const updateEvent = {
      pathParameters: { id: lockerId },
      requestContext: { authorizer: { claims: baseClaims } },
      body: JSON.stringify({ status: "occupied" }),
    };
    const updateRes = await updateLocker.handler(updateEvent);
    expect(updateRes.statusCode).toBe(200);

    // 4. LIST
    listDb.scanTable.mockResolvedValue([updated]);
    const listEvent = { requestContext: { authorizer: { claims: baseClaims } } };
    const listRes = await listLockers.handler(listEvent);
    expect(listRes.statusCode).toBe(200);
    const listBody = JSON.parse(listRes.body);
    expect(listBody.lockers).toEqual([updated]);

    // 5. DELETE
    deleteDb.getItem.mockResolvedValue({ Item: { lockerId, ownerId: userId } });
    deleteDb.deleteItem.mockResolvedValue({});
    const deleteEvent = {
      pathParameters: { id: lockerId },
      requestContext: { authorizer: { claims: baseClaims } },
    };
    const deleteRes = await deleteLocker.handler(deleteEvent);
    expect(deleteRes.statusCode).toBe(201);
  });

  // ------------------------
  // CREATE LOCKER
  // ------------------------
  describe("CreateLocker", () => {
    const baseEvent = {
      body: JSON.stringify({ uuid: lockerId, location: "Mexico", size: "large" }),
      requestContext: { authorizer: { claims: baseClaims } },
    };

    it("should create a locker (201)", async () => {
      createDb.putItems.mockResolvedValue({});
      const res = await createLocker.handler(baseEvent);

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.message).toBe("Locker created successfully");
      expect(body.locker.lockerId).toBe(lockerId);
    });

    it("should return 409 if locker already exists", async () => {
      const err = new Error("exists");
      err.name = "ConditionalCheckFailedException";
      createDb.putItems.mockRejectedValue(err);

      const res = await createLocker.handler(baseEvent);
      expect(res.statusCode).toBe(409);
      expect(JSON.parse(res.body).message).toBe("Locker already exists");
    });

    it("should return 500 on unexpected errors", async () => {
      createDb.putItems.mockRejectedValue(new Error("DynamoDB down"));
      const res = await createLocker.handler(baseEvent);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.body).message).toBe("Internal Server Error");
    });
  });

  // ------------------------
  // GET LOCKER
  // ------------------------
  describe("GetLocker", () => {
    const baseEvent = {
      pathParameters: { id: lockerId },
      requestContext: { authorizer: { claims: baseClaims } },
    };

    it("should return locker (200)", async () => {
      const locker = { lockerId, ownerId: userId, size: "large" };
      getDb.getItem.mockResolvedValue({ Item: locker });

      const res = await getLocker.handler(baseEvent);
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual(locker);
    });

    it("should return 404 if locker not found", async () => {
      getDb.getItem.mockResolvedValue({});
      const res = await getLocker.handler(baseEvent);

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.body).message).toBe("Locker not found");
    });

    it("should return 403 if user is not the owner", async () => {
      getDb.getItem.mockResolvedValue({ Item: { lockerId, ownerId: otherUser } });
      const res = await getLocker.handler(baseEvent);

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.body).message).toBe("You are not the owner of this locker");
    });

    it("should return 500 on unexpected errors", async () => {
      getDb.getItem.mockRejectedValue(new Error("DynamoDB down"));
      const res = await getLocker.handler(baseEvent);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.body).message).toBe("Internal Server Error");
    });
  });

  // ------------------------
  // LIST LOCKERS
  // ------------------------
  describe("ListLockers", () => {
    const baseEvent = { requestContext: { authorizer: { claims: baseClaims } } };

    it("should return all lockers (200)", async () => {
      const lockers = [
        { lockerId, ownerId: userId, size: "large" },
        { lockerId: "5678", ownerId: otherUser, size: "small" },
      ];
      listDb.scanTable.mockResolvedValue(lockers);

      const res = await listLockers.handler(baseEvent);
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).lockers).toEqual(lockers);
    });

    it("should return empty list if no lockers exist (200)", async () => {
      listDb.scanTable.mockResolvedValue([]);
      const res = await listLockers.handler(baseEvent);

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).lockers).toEqual([]);
    });

    it("should return 500 on unexpected errors", async () => {
      listDb.scanTable.mockRejectedValue(new Error("DynamoDB down"));
      const res = await listLockers.handler(baseEvent);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.body).message).toBe("Internal Server Error");
    });
  });

  // ------------------------
  // UPDATE LOCKER
  // ------------------------
  describe("UpdateLocker", () => {
    const baseEvent = {
      pathParameters: { id: lockerId },
      requestContext: { authorizer: { claims: baseClaims } },
      body: JSON.stringify({ status: "occupied", location: "Mexico", size: "large" }),
    };

    it("should update a locker (200)", async () => {
      const updated = { lockerId, ownerId: userId, status: "occupied", location: "Mexico", size: "large" };
      updateDb.getItem.mockResolvedValue({ Item: { lockerId, ownerId: userId } });
      updateDb.updateItem.mockResolvedValue({ Attributes: updated });

      const res = await updateLocker.handler(baseEvent);
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual(updated);
    });

    it("should return 403 if user is not the owner", async () => {
      updateDb.getItem.mockResolvedValue({ Item: { lockerId, ownerId: otherUser } });
      const res = await updateLocker.handler(baseEvent);

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.body).message).toBe("You are not the owner of this locker");
    });

    it("should return 404 if update fails with ConditionalCheckFailedException", async () => {
      updateDb.getItem.mockResolvedValue({ Item: { lockerId, ownerId: userId } });
      const err = new Error("not found");
      err.name = "ConditionalCheckFailedException";
      updateDb.updateItem.mockRejectedValue(err);

      const res = await updateLocker.handler(baseEvent);
      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.body).message).toBe("Locker not found");
    });

    it("should return 500 on unexpected errors", async () => {
      updateDb.getItem.mockResolvedValue({ Item: { lockerId, ownerId: userId } });
      updateDb.updateItem.mockRejectedValue(new Error("DynamoDB down"));

      const res = await updateLocker.handler(baseEvent);
      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.body).message).toBe("Internal Server Error");
    });
  });

  // ------------------------
  // DELETE LOCKER
  // ------------------------
  describe("DeleteLocker", () => {
    const baseEvent = {
      pathParameters: { id: lockerId },
      requestContext: { authorizer: { claims: baseClaims } },
    };

    it("should delete locker (201)", async () => {
      deleteDb.getItem.mockResolvedValue({ Item: { lockerId, ownerId: userId } });
      deleteDb.deleteItem.mockResolvedValue({});

      const res = await deleteLocker.handler(baseEvent);
      expect(res.statusCode).toBe(201);
      expect(JSON.parse(res.body).message).toBe("Locker deleted successfully");
    });

    it("should return 404 if locker not found", async () => {
      deleteDb.getItem.mockResolvedValue({});
      const res = await deleteLocker.handler(baseEvent);

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.body).message).toBe("Locker not found");
    });

    it("should return 403 if user is not the owner", async () => {
      deleteDb.getItem.mockResolvedValue({ Item: { lockerId, ownerId: otherUser } });
      const res = await deleteLocker.handler(baseEvent);

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.body).message).toBe("You are not the owner of this locker");
    });

    it("should return 404 if delete fails with ConditionalCheckFailedException", async () => {
      deleteDb.getItem.mockResolvedValue({ Item: { lockerId, ownerId: userId } });
      const err = new Error("not found");
      err.name = "ConditionalCheckFailedException";
      deleteDb.deleteItem.mockRejectedValue(err);

      const res = await deleteLocker.handler(baseEvent);
      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.body).message).toBe("Locker not found");
    });

    it("should return 500 on unexpected errors", async () => {
      deleteDb.getItem.mockResolvedValue({ Item: { lockerId, ownerId: userId } });
      deleteDb.deleteItem.mockRejectedValue(new Error("DynamoDB down"));

      const res = await deleteLocker.handler(baseEvent);
      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.body).message).toBe("Internal Server Error");
    });
  });
});
