import { test, mock } from "node:test";
import assert from "node:assert/strict";

const databaseMock = {
    connect: async () => databaseClientMock,
    query: async (sql, values = []) => {
        databaseClientMock.queries.push({ sql, values });
        return { rows: [] };
    },
};

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

mock.module("../src/config/db.js", {
    exports: {
        default: databaseMock,
    },
});



mock.module("../src/utils/password.js", {
    exports: {
        hashPassword: async () => {
            return "mocked-password-hash";
        },
        verifyPassword: async () => false,
    },
});


mock.module("../src/services/emailService.js", {
    exports: {
        sendStaffInvitationEmail: async () => {
            throw new Error(
                "Email should not be sent by this test"
            );
        },
    },
});

const { acceptStaffInvitation, createStaffInvitation } = await import(
    "../src/controllers/staffInvitationController.js"
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

test("rejects a missing invitation token without accessing dependencies", async () => {
    const req = {
        body: {
            password: "a-long-test-password",
        },
    };

    const res = createResponse();

    await acceptStaffInvitation(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /token/i);
});



test("rejects a malformed invitation token", async () => {
    const req = {
        body: {
            token: "not-a-valid-token",
            password: "a-long-test-password",
        },
    };

    const res = createResponse();

    await acceptStaffInvitation(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /token/i);
});

test("rejects a password shorter than 12 characters", async () => {
    const req = {
        body: {
            token: "a".repeat(64),
            password: "short",
        },
    };

    const res = createResponse();

    await acceptStaffInvitation(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /at least 12 characters/i);
});




test("rejects an unknown invitation and rolls back the transaction", async () => {
    databaseClientMock.queries.length = 0;

    const req = {
        body: {
            token: "a".repeat(64),
            password: "a-long-test-password",
        },
    };

    const res = createResponse();

    await acceptStaffInvitation(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /invalid or no longer available/i);

    const executedQueries = databaseClientMock.queries.map(
        ({ sql }) => sql.trim().toUpperCase()
    );

    assert.ok(executedQueries.includes("BEGIN"));
    assert.ok(executedQueries.includes("ROLLBACK"));
    assert.ok(!executedQueries.includes("COMMIT"));
});




test("rejects an expired invitation and rolls back the transaction", async () => {
    databaseClientMock.queries.length = 0;
    databaseClientMock.queryResponses.length = 0;

    databaseClientMock.queryResponses.push(
        { rows: [] },
        {
            rows: [
                {
                    invitation_id: "test-invitation-id",
                    school_id: "test-school-id",
                    school_staff_id: "test-staff-id",
                    invitation_email: "teacher@example.com",
                    expires_at: "2020-01-01T00:00:00.000Z",
                    accepted_at: null,
                    invalidated_at: null,
                    first_name: "Test",
                    last_name: "Teacher",
                    staff_email: "teacher@example.com",
                    staff_status: "active",
                },
            ],
        }
    );

    const req = {
        body: {
            token: "a".repeat(64),
            password: "a-long-test-password",
        },
    };

    const res = createResponse();

    await acceptStaffInvitation(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(
        res.body.message,
        /invalid|expired|already used/i
    );

    const executedQueries = databaseClientMock.queries.map(
        ({ sql }) => sql.trim().toUpperCase()
    );

    assert.ok(executedQueries.includes("BEGIN"));
    assert.ok(executedQueries.includes("ROLLBACK"));
    assert.ok(!executedQueries.includes("COMMIT"));

    databaseClientMock.queryResponses.length = 0;
});




test("rejects an already-accepted invitation and rolls back the transaction", async () => {
    databaseClientMock.queries.length = 0;
    databaseClientMock.queryResponses.length = 0;

    databaseClientMock.queryResponses.push(
        { rows: [] },
        {
            rows: [
                {
                    invitation_id: "test-invitation-id",
                    school_id: "test-school-id",
                    school_staff_id: "test-staff-id",
                    invitation_email: "teacher@example.com",
                    expires_at: "2099-01-01T00:00:00.000Z",
                    accepted_at: "2026-10-01T10:00:00.000Z",
                    invalidated_at: null,
                    first_name: "Test",
                    last_name: "Teacher",
                    staff_email: "teacher@example.com",
                    staff_status: "active",
                },
            ],
        }
    );

    const req = {
        body: {
            token: "a".repeat(64),
            password: "a-long-test-password",
        },
    };

    const res = createResponse();

    await acceptStaffInvitation(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(
        res.body.message,
        /invalid|expired|already used/i
    );

    const executedQueries = databaseClientMock.queries.map(
        ({ sql }) => sql.trim().toUpperCase()
    );

    assert.ok(executedQueries.includes("BEGIN"));
    assert.ok(executedQueries.includes("ROLLBACK"));
    assert.ok(!executedQueries.includes("COMMIT"));

    databaseClientMock.queryResponses.length = 0;
});




test("rejects an invalidated invitation and rolls back the transaction", async () => {
    databaseClientMock.queries.length = 0;
    databaseClientMock.queryResponses.length = 0;

    databaseClientMock.queryResponses.push(
        { rows: [] },
        {
            rows: [
                {
                    invitation_id: "test-invitation-id",
                    school_id: "test-school-id",
                    school_staff_id: "test-staff-id",
                    invitation_email: "teacher@example.com",
                    expires_at: "2099-01-01T00:00:00.000Z",
                    accepted_at: null,
                    invalidated_at: "2026-10-01T10:00:00.000Z",
                    first_name: "Test",
                    last_name: "Teacher",
                    staff_email: "teacher@example.com",
                    staff_status: "active",
                },
            ],
        }
    );

    const req = {
        body: {
            token: "a".repeat(64),
            password: "a-long-test-password",
        },
    };

    const res = createResponse();

    await acceptStaffInvitation(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(
        res.body.message,
        /invalid|expired|already used/i
    );

    const executedQueries = databaseClientMock.queries.map(
        ({ sql }) => sql.trim().toUpperCase()
    );

    assert.ok(executedQueries.includes("BEGIN"));
    assert.ok(executedQueries.includes("ROLLBACK"));
    assert.ok(!executedQueries.includes("COMMIT"));

    databaseClientMock.queryResponses.length = 0;
});


test("accepts a valid invitation and commits the transaction", async () => {
    databaseClientMock.queries.length = 0;
    databaseClientMock.queryResponses.length = 0;

    databaseClientMock.queryResponses.push(
        // BEGIN
        { rows: [] },

        // Invitation lookup
        {
            rows: [
                {
                    invitation_id: "test-invitation-id",
                    school_id: "test-school-id",
                    school_staff_id: "test-staff-id",
                    invitation_email: "teacher@example.com",
                    expires_at: "2099-01-01T00:00:00.000Z",
                    accepted_at: null,
                    invalidated_at: null,
                    first_name: "Test",
                    last_name: "Teacher",
                    staff_email: "teacher@example.com",
                    staff_status: "active",
                },
            ],
        },

        // Eligible position lookup
        {
            rows: [
                {
                    position_code: "head_teacher",
                },
            ],
        },

        // Application role lookup
        {
            rows: [
                {
                    id: "test-role-id",
                    name: "Teacher",
                },
            ],
        },

        // Existing user lookup
        { rows: [] },

        // User insertion
        {
            rows: [
                {
                    id: "test-user-id",
                    school_id: "test-school-id",
                    first_name: "Test",
                    last_name: "Teacher",
                    email: "teacher@example.com",
                    status: "active",
                },
            ],
        },

        // User-role assignment
        { rows: [] },

        // Mark invitation as accepted
        {
            rows: [
                {
                    id: "test-invitation-id",
                },
            ],
        },

        // COMMIT
        { rows: [] },
    );

    const req = {
        body: {
            token: "a".repeat(64),
            password: "a-long-test-password",
        },
    };

    const res = createResponse();

    await acceptStaffInvitation(req, res);

    assert.equal(res.statusCode, 201);
    assert.match(res.body.message, /accepted successfully/i);
    assert.equal(res.body.user.id, "test-user-id");
    assert.equal(res.body.user.email, "teacher@example.com");

    const executedQueries = databaseClientMock.queries.map(
        ({ sql }) => sql.trim().toUpperCase()
    );

    assert.ok(executedQueries.includes("BEGIN"));
    assert.ok(executedQueries.includes("COMMIT"));
    assert.ok(!executedQueries.includes("ROLLBACK"));

    assert.ok(
        databaseClientMock.queries.some(({ sql }) =>
            sql.includes("INSERT INTO users")
        )
    );

    assert.ok(
        databaseClientMock.queries.some(({ sql }) =>
            sql.includes("INSERT INTO user_roles")
        )
    );

    assert.ok(
        databaseClientMock.queries.some(({ sql }) =>
            sql.includes("UPDATE staff_invitations")
        )
    );

    databaseClientMock.queryResponses.length = 0;
});


test("rejects an invitation when an account already exists for the email", async () => {
    databaseClientMock.queries.length = 0;
    databaseClientMock.queryResponses.length = 0;

    databaseClientMock.queryResponses.push(
        // BEGIN
        { rows: [] },

        // Invitation lookup
        {
            rows: [
                {
                    invitation_id: "test-invitation-id",
                    school_id: "test-school-id",
                    school_staff_id: "test-staff-id",
                    invitation_email: "teacher@example.com",
                    expires_at: "2099-01-01T00:00:00.000Z",
                    accepted_at: null,
                    invalidated_at: null,
                    first_name: "Test",
                    last_name: "Teacher",
                    staff_email: "teacher@example.com",
                    staff_status: "active",
                },
            ],
        },

        // Eligible position lookup
        {
            rows: [
                {
                    position_code: "head_teacher",
                },
            ],
        },

        // Application role lookup
        {
            rows: [
                {
                    id: "test-role-id",
                    name: "Teacher",
                },
            ],
        },

        // Existing account found
        {
            rows: [
                {
                    id: "existing-user-id",
                },
            ],
        },
    );

    const req = {
        body: {
            token: "a".repeat(64),
            password: "a-long-test-password",
        },
    };

    const res = createResponse();

    await acceptStaffInvitation(req, res);

    assert.equal(res.statusCode, 409);
    assert.match(res.body.message, /account already exists/i);

    const executedQueries = databaseClientMock.queries.map(
        ({ sql }) => sql.trim().toUpperCase()
    );

    assert.ok(executedQueries.includes("BEGIN"));
    assert.ok(executedQueries.includes("ROLLBACK"));
    assert.ok(!executedQueries.includes("COMMIT"));

    assert.ok(
        !databaseClientMock.queries.some(({ sql }) =>
            sql.includes("INSERT INTO users")
        )
    );

    assert.ok(
        !databaseClientMock.queries.some(({ sql }) =>
            sql.includes("INSERT INTO user_roles")
        )
    );

    databaseClientMock.queryResponses.length = 0;
});


test("rolls back when the required application role is missing", async () => {
    databaseClientMock.queries.length = 0;
    databaseClientMock.queryResponses.length = 0;

    databaseClientMock.queryResponses.push(
        // BEGIN
        { rows: [] },

        // Invitation lookup
        {
            rows: [
                {
                    invitation_id: "test-invitation-id",
                    school_id: "test-school-id",
                    school_staff_id: "test-staff-id",
                    invitation_email: "teacher@example.com",
                    expires_at: "2099-01-01T00:00:00.000Z",
                    accepted_at: null,
                    invalidated_at: null,
                    first_name: "Test",
                    last_name: "Teacher",
                    staff_email: "teacher@example.com",
                    staff_status: "active",
                },
            ],
        },

        // Eligible position lookup
        {
            rows: [
                {
                    position_code: "head_teacher",
                },
            ],
        },

        // Required application role is missing
        { rows: [] },
    );

    const req = {
        body: {
            token: "a".repeat(64),
            password: "a-long-test-password",
        },
    };

    const res = createResponse();

    await acceptStaffInvitation(req, res);

    assert.equal(res.statusCode, 500);
    assert.match(res.body.message, /unable to process the invitation/i);

    const executedQueries = databaseClientMock.queries.map(
        ({ sql }) => sql.trim().toUpperCase()
    );

    assert.ok(executedQueries.includes("BEGIN"));
    assert.ok(executedQueries.includes("ROLLBACK"));
    assert.ok(!executedQueries.includes("COMMIT"));

    assert.ok(
        !databaseClientMock.queries.some(({ sql }) =>
            sql.includes("INSERT INTO users")
        )
    );

    databaseClientMock.queryResponses.length = 0;
});


test("rejects an invitation when the staff member has no eligible position", async () => {
    databaseClientMock.queries.length = 0;
    databaseClientMock.queryResponses.length = 0;

    databaseClientMock.queryResponses.push(
        // BEGIN
        { rows: [] },

        // Invitation lookup
        {
            rows: [
                {
                    invitation_id: "test-invitation-id",
                    school_id: "test-school-id",
                    school_staff_id: "test-staff-id",
                    invitation_email: "teacher@example.com",
                    expires_at: "2099-01-01T00:00:00.000Z",
                    accepted_at: null,
                    invalidated_at: null,
                    first_name: "Test",
                    last_name: "Teacher",
                    staff_email: "teacher@example.com",
                    staff_status: "active",
                },
            ],
        },

        // No currently eligible position
        { rows: [] },
    );

    const req = {
        body: {
            token: "a".repeat(64),
            password: "a-long-test-password",
        },
    };

    const res = createResponse();

    await acceptStaffInvitation(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(
        res.body.message,
        /current position/i
    );

    const executedQueries = databaseClientMock.queries.map(
        ({ sql }) => sql.trim().toUpperCase()
    );

    assert.ok(executedQueries.includes("BEGIN"));
    assert.ok(executedQueries.includes("ROLLBACK"));
    assert.ok(!executedQueries.includes("COMMIT"));

    assert.ok(
        !databaseClientMock.queries.some(({ sql }) =>
            sql.includes("INSERT INTO users")
        )
    );

    databaseClientMock.queryResponses.length = 0;
});


test("rejects an invitation for an inactive staff member", async () => {
    databaseClientMock.queries.length = 0;
    databaseClientMock.queryResponses.length = 0;

    databaseClientMock.queryResponses.push(
        // BEGIN
        { rows: [] },

        // Invitation belongs to an inactive staff member
        {
            rows: [
                {
                    invitation_id: "test-invitation-id",
                    school_id: "test-school-id",
                    school_staff_id: "test-staff-id",
                    invitation_email: "teacher@example.com",
                    expires_at: "2099-01-01T00:00:00.000Z",
                    accepted_at: null,
                    invalidated_at: null,
                    first_name: "Test",
                    last_name: "Teacher",
                    staff_email: "teacher@example.com",
                    staff_status: "inactive",
                },
            ],
        },
    );

    const req = {
        body: {
            token: "a".repeat(64),
            password: "a-long-test-password",
        },
    };

    const res = createResponse();

    await acceptStaffInvitation(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(
        res.body.message,
        /no longer valid for this staff member/i
    );

    const executedQueries = databaseClientMock.queries.map(
        ({ sql }) => sql.trim().toUpperCase()
    );

    assert.ok(executedQueries.includes("BEGIN"));
    assert.ok(executedQueries.includes("ROLLBACK"));
    assert.ok(!executedQueries.includes("COMMIT"));

    assert.ok(
        !databaseClientMock.queries.some(({ sql }) =>
            sql.includes("INSERT INTO users")
        )
    );

    databaseClientMock.queryResponses.length = 0;
});


test("rejects an invitation when the staff email no longer matches", async () => {
    databaseClientMock.queries.length = 0;
    databaseClientMock.queryResponses.length = 0;

    databaseClientMock.queryResponses.push(
        // BEGIN
        { rows: [] },

        // Invitation email differs from the staff member's current email
        {
            rows: [
                {
                    invitation_id: "test-invitation-id",
                    school_id: "test-school-id",
                    school_staff_id: "test-staff-id",
                    invitation_email: "old-email@example.com",
                    expires_at: "2099-01-01T00:00:00.000Z",
                    accepted_at: null,
                    invalidated_at: null,
                    first_name: "Test",
                    last_name: "Teacher",
                    staff_email: "new-email@example.com",
                    staff_status: "active",
                },
            ],
        },
    );

    const req = {
        body: {
            token: "a".repeat(64),
            password: "a-long-test-password",
        },
    };

    const res = createResponse();

    await acceptStaffInvitation(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(
        res.body.message,
        /no longer valid for this staff member/i
    );

    const executedQueries = databaseClientMock.queries.map(
        ({ sql }) => sql.trim().toUpperCase()
    );

    assert.ok(executedQueries.includes("BEGIN"));
    assert.ok(executedQueries.includes("ROLLBACK"));
    assert.ok(!executedQueries.includes("COMMIT"));

    assert.ok(
        !databaseClientMock.queries.some(({ sql }) =>
            sql.includes("INSERT INTO users")
        )
    );

    databaseClientMock.queryResponses.length = 0;
});



test("invalidates the invitation when email delivery fails", async () => {
    databaseClientMock.queries.length = 0;
    databaseClientMock.queryResponses.length = 0;

    databaseClientMock.queryResponses.push(
            { rows: [] },
        // Staff lookup
        {
            rows: [
                {
                    id: "test-staff-id",
                    first_name: "Test",
                    last_name: "Teacher",
                    email: "teacher@example.com",
                    status: "active",
                },
            ],
        },

        // Inviting user lookup
        {
            rows: [
                {
                    first_name: "Test",
                    last_name: "Principal",
                },
            ],
        },

        // Eligible position lookup
        {
            rows: [
                {
                    position_code: "head_teacher",
                },
            ],
        },

        // Existing login account lookup
        { rows: [] },

        // Previous invitations invalidated
        { rows: [] },

        // New invitation inserted
        {
            rows: [
                {
                    id: "test-invitation-id",
                    expires_at: "2099-01-01T00:00:00.000Z",
                },
            ],
        },

        // Email-failure cleanup
        { rows: [] },
    );

    const previousFrontendUrl = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = "http://localhost:5173";

    const req = {
        params: {
            id: "test-staff-id",
        },
        schoolId: "test-school-id",
        user: {
            userId: "test-principal-id",
        },
    };

    const res = createResponse();

    try {
        await createStaffInvitation(req, res);

        assert.equal(res.statusCode, 500);
        assert.match(
            res.body.message,
            /failed to send staff invitation/i
        );

        const executedQueries = databaseClientMock.queries.map(
            ({ sql }) => sql.trim().toUpperCase()
        );

        assert.ok(executedQueries.includes("BEGIN"));
        assert.ok(executedQueries.includes("COMMIT"));

       const invalidationQuery = databaseClientMock.queries.find(
    ({ sql }) =>
        sql.includes("SET invalidated_at = NOW()") &&
        sql.includes("WHERE id = $1")
);

    assert.ok(
        invalidationQuery,
        "The failed invitation should be invalidated by its ID."
    );

    assert.equal(
        invalidationQuery.values[0],
        "test-invitation-id",
        "The controller should invalidate the invitation that was just created."
    );

        assert.ok(executedQueries.includes("ROLLBACK") === false);
    } finally {
        if (previousFrontendUrl === undefined) {
            delete process.env.FRONTEND_URL;
        } else {
            process.env.FRONTEND_URL = previousFrontendUrl;
        }

        databaseClientMock.queryResponses.length = 0;
    }
});



test("rejects invitation creation for inactive staff", async () => {
        const previousFrontendUrl = process.env.FRONTEND_URL;
         process.env.FRONTEND_URL = "http://localhost:5173";
    databaseClientMock.queries.length = 0;
    databaseClientMock.queryResponses.length = 0;

    databaseClientMock.queryResponses.push(
        // BEGIN
          { rows: [] },

        // Staff lookup returns an inactive staff member
        {
            rows: [
                {
                    id: "test-staff-id",
                    first_name: "Test",
                    last_name: "Teacher",
                    email: "teacher@example.com",
                    status: "inactive",
                },
            ],
        },

        // Inviting Principal exists in the same school
        {
            rows: [
                {
                    first_name: "Test",
                    last_name: "Principal",
                },
            ],
        },
    );

    const req = {
        params: {
            id: "test-staff-id",
        },
        schoolId: "test-school-id",
        user: {
            userId: "test-principal-id",
        },
    };

    const res = createResponse();

    await createStaffInvitation(req, res);


    assert.equal(res.statusCode, 400);
    assert.match(
        res.body.message,
        /inactive staff cannot be invited/i
    );

    const executedQueries = databaseClientMock.queries.map(
        ({ sql }) => sql.trim().toUpperCase()
    );

    assert.ok(executedQueries.includes("BEGIN"));
    assert.ok(executedQueries.includes("ROLLBACK"));
    assert.ok(!executedQueries.includes("COMMIT"));

    assert.ok(
        !databaseClientMock.queries.some(({ sql }) =>
            sql.includes("INSERT INTO staff_invitations")
        )
    );

    databaseClientMock.queryResponses.length = 0;

        if (previousFrontendUrl === undefined) {
        delete process.env.FRONTEND_URL;
    } else {
        process.env.FRONTEND_URL = previousFrontendUrl;
    }
});
