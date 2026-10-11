
import { test, mock } from "node:test";
import assert from "node:assert/strict";

const databaseClientMock = {
    queries: [],
    queryResponses: [],
    query: async (sql, values = []) => {
        databaseClientMock.queries.push({ sql, values });

        if (databaseClientMock.queryResponses.length > 0) {
            return databaseClientMock.queryResponses.shift();
        }

        return { rows: [] };
    },
    release: () => {},
};

const databaseMock = {
    queries: [],
    queryResponses: [],
    connect: async () => databaseClientMock,
    query: async (sql, values = []) => {
        databaseMock.queries.push({ sql, values });

        if (databaseMock.queryResponses.length > 0) {
            return databaseMock.queryResponses.shift();
        }

        return { rows: [] };
    },
};

const resetMocks = () => {
    databaseMock.queries = [];
    databaseMock.queryResponses = [];
    databaseClientMock.queries = [];
    databaseClientMock.queryResponses = [];
};

mock.module("../src/config/db.js", {
    exports: {
        default: databaseMock,
    },
});

mock.module("../src/utils/password.js", {
    exports: {
        hashPassword: async () => "mocked-password-hash",
        verifyPassword: async () => true,
    },
});


mock.module("jsonwebtoken", {
    exports: {
        default: {
            sign: () => "mocked-test-token",
        },
    },
});


const { registerUser, registerSchool, loginUser } = await import(
    "../src/controllers/authController.js"
);

const createResponse = () => ({
    statusCode: null,
    body: null,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    },
});

test("registerUser trims and lowercases email before database insertion", async () => {
    resetMocks();

    databaseClientMock.queryResponses.push(
        { rows: [] },
        { rows: [{ id: "user-1", email: "person@example.com" }] },
        { rows: [] },
    );

    const req = {
        schoolId: "school-1",
        body: {
            firstName: "Test",
            lastName: "User",
            email: "  PERSON@Example.COM  ",
            password: "test-password",
            roleId: "role-1",
        },
    };

    const res = createResponse();

    await registerUser(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(
        databaseClientMock.queries[1].values[3],
        "person@example.com",
    );
});

test("registerUser rejects a non-string email through validation", async () => {
    resetMocks();

    const req = {
        schoolId: "school-1",
        body: {
            firstName: "Test",
            lastName: "User",
            email: 12345,
            password: "test-password",
            roleId: "role-1",
        },
    };

    const res = createResponse();

    await registerUser(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(databaseClientMock.queries.length, 0);
});

test("registerSchool normalizes school and user emails before insertion", async () => {
    resetMocks();

    databaseClientMock.queryResponses.push(
            { rows: [] }, // BEGIN
        {
            rows: [{
                id: "school-1",
                name: "Example School",
                email: "school@example.com",
            }],
        },
        {
            rows: [{ id: "staff-1" }],
        },
        {
            rows: [{
                id: "user-1",
                school_id: "school-1",
                email: "admin@example.com",
                first_name: "Test",
                last_name: "Admin",
                status: "active",
                school_staff_id: "staff-1",
            }],
        },
        {
            rows: [
                { id: "role-1", name: "Principal" },
                { id: "role-2", name: "School Admin" },
            ],
        },
        { rows: [] },
        { rows: [] },
        { rows: [] },
        { rows: [] },
    );

    const req = {
        body: {
            schoolName: "Example School",
            schoolEmail: "  SCHOOL@Example.COM ",
            schoolPhone: "08000000000",
            schoolAddress: "Example Address",
            firstName: "Test",
            lastName: "Admin",
            email: "  ADMIN@Example.COM ",
            password: "test-password",
        },
    };

    const res = createResponse();

    await registerSchool(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(databaseClientMock.queries[1].values[2], "school@example.com");
    assert.equal(databaseClientMock.queries[3].values[4], "admin@example.com");
});

test("registerSchool rejects a non-string email through validation", async () => {
    resetMocks();

    const req = {
        body: {
            schoolName: "Example School",
            schoolEmail: "school@example.com",
            schoolPhone: "08000000000",
            schoolAddress: "Example Address",
            firstName: "Test",
            lastName: "Admin",
            email: {},
            password: "test-password",
        },
    };

    const res = createResponse();

    await registerSchool(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(databaseClientMock.queries.length, 0);
});

test("loginUser queries using the trimmed, lowercase email", async () => {
    resetMocks();

    databaseMock.queryResponses.push({
        rows: [{
            id: "user-1",
            school_id: "school-1",
            first_name: "Test",
            last_name: "User",
            email: "person@example.com",
            password_hash: "mocked-password-hash",
            status: "active",
            role_id: "role-1",
            role: "admin",
        }],
    });

    const req = {
        body: {
            email: "  PERSON@Example.COM ",
            password: "test-password",
        },
    };

    const res = createResponse();

    await loginUser(req, res);

    assert.equal(databaseMock.queries[0].values[0], "person@example.com");
    assert.notEqual(res.statusCode, 500);
});

test("loginUser rejects a non-string email through validation", async () => {
    resetMocks();

    const req = {
        body: {
            email: ["person@example.com"],
            password: "test-password",
        },
    };

    const res = createResponse();

    await loginUser(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(databaseMock.queries.length, 0);
});
