
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import "./StaffManagement.css";

const API_BASE_URL = "http://localhost:5000/api";

const INITIAL_FORM = {
    staffId: "",
    firstName: "",
    lastName: "",
    gender: "",
    email: "",
    positionCode: "",
    subject: "",
};

const TEACHING_POSITIONS = ["teacher", "head_teacher"];

const formatDate = (value) => {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const formatStatus = (status) => {
    const labels = {
        not_invited: "Not invited",
        pending: "Pending",
        accepted: "Accepted",
        expired: "Expired",
        invalidated: "Invalidated",
    };

    return labels[status] || status || "Not invited";
};

const StaffManagement = () => {
    const { authToken } = useAuth();

    const [staff, setStaff] = useState([]);
    const [positions, setPositions] = useState([]);
    const [invitationStatuses, setInvitationStatuses] = useState({});
    const [form, setForm] = useState(INITIAL_FORM);
    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sendingInvitationId, setSendingInvitationId] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [staffToDeactivate, setStaffToDeactivate] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const request = useCallback(
        async (path, options = {}) => {
            const response = await fetch(`${API_BASE_URL}${path}`, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                    ...options.headers,
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message || "The request could not be completed."
                );
            }

            return data;
        },
        [authToken]
    );

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [staffData, positionData, invitationData] =
                await Promise.all([
                    request("/staff"),
                    request("/staff/positions"),
                    request("/staff/invitations/status"),
                ]);

            setStaff(staffData.staff || []);
            setPositions(positionData.positions || []);

            const statusMap = {};

            (invitationData.invitationStatuses || []).forEach((item) => {
                statusMap[item.staff_id] = item;
            });

            setInvitationStatuses(statusMap);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, [request]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const selectedPosition = positions.find(
        (position) => position.code === form.positionCode
    );

    const needsSubject = TEACHING_POSITIONS.includes(
        selectedPosition?.code
    );

    const updateField = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
            ...(name === "positionCode" ? { subject: "" } : {}),
        }));
    };

    const handleCreateStaff = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");

        try {
            const payload = {
                staffId: form.staffId.trim(),
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                gender: form.gender || null,
                email: form.email.trim() || null,
                positionCode: form.positionCode,
                ...(needsSubject ? { subject: form.subject.trim() } : {}),
            };

            await request("/staff", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            setForm(INITIAL_FORM);
            setShowForm(false);
            setMessage("Staff member added successfully.");

            await loadData();
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSendInvitation = async (staffMember) => {
        setSendingInvitationId(staffMember.id);
        setError("");
        setMessage("");

        try {
            const result = await request(
                `/staff/${staffMember.id}/invitation`,
                { method: "POST" }
            );

            setMessage(
                result.message ||
                    `Invitation sent to ${staffMember.email}.`
            );

            await loadData();
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSendingInvitationId(null);
        }
    };

    const handleDeactivate = async () => {
        if (!staffToDeactivate) return;

        setProcessingId(staffToDeactivate.id);
        setError("");
        setMessage("");

        try {
            await request(`/staff/${staffToDeactivate.id}`, {
                method: "DELETE",
            });

            setStaffToDeactivate(null);
            setMessage("Staff member deactivated successfully.");

            await loadData();
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReactivate = async (staffMember) => {
        setProcessingId(staffMember.id);
        setError("");
        setMessage("");

        try {
            await request(`/staff/${staffMember.id}/reactivate`, {
                method: "PATCH",
            });

            setMessage("Staff member reactivated successfully.");

            await loadData();
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredStaff = staff.filter((member) => {
        const search = searchTerm.trim().toLowerCase();

        if (!search) return true;

        return [
            member.staff_id,
            member.first_name,
            member.last_name,
            member.email,
            member.position_name,
            member.position_code,
        ].some((value) => String(value || "").toLowerCase().includes(search));
    });

    return (
        <main className="staff-management">
            <header className="staff-page-header">
                <div>
                    <p className="staff-eyebrow">SCHOOL ADMINISTRATION</p>
                    <h1>Staff Management</h1>
                    <p className="staff-page-description">
                        Manage staff records, account invitations, and staff
                        status in one place.
                    </p>
                </div>

                <button
                    type="button"
                    className="staff-primary-button"
                    onClick={() => {
                        setError("");
                        setMessage("");
                        setShowForm((previous) => !previous);
                    }}
                >
                    {showForm ? "Close form" : "+ Add staff member"}
                </button>
            </header>

            {error && (
                <div className="staff-notice staff-notice-error" role="alert">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => setError("")}
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            {message && (
                <div className="staff-notice staff-notice-success" role="status">
                    <span>{message}</span>
                    <button
                        type="button"
                        onClick={() => setMessage("")}
                        aria-label="Dismiss message"
                    >
                        ×
                    </button>
                </div>
            )}

            <section className="staff-summary-grid">
                <article className="staff-summary-card">
                    <span>Total staff</span>
                    <strong>{staff.length}</strong>
                </article>

                <article className="staff-summary-card">
                    <span>Active staff</span>
                    <strong>
                        {staff.filter((member) => member.status === "active").length}
                    </strong>
                </article>

                <article className="staff-summary-card">
                    <span>Pending invitations</span>
                    <strong>
                        {
                            Object.values(invitationStatuses).filter(
                                (item) => item.invitation_status === "pending"
                            ).length
                        }
                    </strong>
                </article>

                <article className="staff-summary-card">
                    <span>Accounts accepted</span>
                    <strong>
                        {
                            Object.values(invitationStatuses).filter(
                                (item) => item.invitation_status === "accepted"
                            ).length
                        }
                    </strong>
                </article>
            </section>

            {showForm && (
                <section className="staff-panel">
                    <div className="staff-panel-heading">
                        <div>
                            <h2>Add staff member</h2>
                            <p>
                                Create the staff record first. You can send the
                                account invitation separately.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateStaff}>
                        <div className="staff-form-grid">
                            <label className="staff-field">
                                Staff ID
                                <input
                                    name="staffId"
                                    value={form.staffId}
                                    onChange={updateField}
                                    placeholder="e.g. STF001"
                                    required
                                />
                            </label>

                            <label className="staff-field">
                                First name
                                <input
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={updateField}
                                    autoComplete="given-name"
                                    required
                                />
                            </label>

                            <label className="staff-field">
                                Last name
                                <input
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={updateField}
                                    autoComplete="family-name"
                                    required
                                />
                            </label>

                            <label className="staff-field">
                                Gender
                                <select
                                    name="gender"
                                    value={form.gender}
                                    onChange={updateField}
                                >
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </label>

                            <label className="staff-field">
                                Official email
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={updateField}
                                    autoComplete="email"
                                    placeholder="staff@school.com"
                                />
                                <small>
                                    Required before an account invitation can
                                    be sent.
                                </small>
                            </label>

                            <label className="staff-field">
                                Staff position
                                <select
                                    name="positionCode"
                                    value={form.positionCode}
                                    onChange={updateField}
                                    required
                                >
                                    <option value="">Select position</option>
                                    {positions.map((position) => (
                                        <option
                                            key={position.id}
                                            value={position.code}
                                        >
                                            {position.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {needsSubject && (
                                <label className="staff-field staff-field-full">
                                    Teaching subject
                                    <input
                                        name="subject"
                                        value={form.subject}
                                        onChange={updateField}
                                        placeholder="e.g. Mathematics"
                                        required
                                    />
                                </label>
                            )}
                        </div>

                        <div className="staff-form-actions">
                            <button
                                type="button"
                                className="staff-secondary-button"
                                onClick={() => {
                                    setShowForm(false);
                                    setForm(INITIAL_FORM);
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="staff-primary-button"
                                disabled={saving || positions.length === 0}
                            >
                                {saving ? "Saving..." : "Save staff record"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="staff-panel">
                <div className="staff-list-heading">
                    <div>
                        <h2>School staff</h2>
                        <p>Staff records and login invitation status.</p>
                    </div>

                    <input
                        className="staff-search"
                        type="search"
                        placeholder="Search staff..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        aria-label="Search staff"
                    />
                </div>

                {loading ? (
                    <div className="staff-empty-state">Loading staff records...</div>
                ) : filteredStaff.length === 0 ? (
                    <div className="staff-empty-state">
                        {staff.length === 0
                            ? "No staff records yet. Add your first staff member to get started."
                            : "No staff members match your search."}
                    </div>
                ) : (
                    <div className="staff-table-wrapper">
                        <table className="staff-table">
                            <thead>
                                <tr>
                                    <th>Staff member</th>
                                    <th>Position</th>
                                    <th>Official email</th>
                                    <th>Staff status</th>
                                    <th>Account invitation</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredStaff.map((member) => {
                                    const invitation =
                                        invitationStatuses[member.id];

                                    const invitationStatus =
                                        invitation?.invitation_status ||
                                        "not_invited";

                                    const isActive = member.status === "active";
                                    const isAccepted =
                                        invitationStatus === "accepted";

                                    return (
                                        <tr key={member.id}>
                                            <td>
                                                <div className="staff-member-name">
                                                    {member.first_name}{" "}
                                                    {member.last_name}
                                                </div>
                                                <span className="staff-secondary-text">
                                                    {member.staff_id}
                                                </span>
                                            </td>

                                            <td>
                                                {member.position_name || "—"}
                                                {member.teacher_subject && (
                                                    <span className="staff-secondary-text staff-subject">
                                                        {member.teacher_subject}
                                                    </span>
                                                )}
                                            </td>

                                            <td>{member.email || "Not provided"}</td>

                                            <td>
                                                <span
                                                    className={`staff-status staff-status-${isActive ? "active" : "inactive"}`}
                                                >
                                                    {isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`staff-status staff-invitation-${invitationStatus.replace("_", "-")}`}
                                                >
                                                    {formatStatus(invitationStatus)}
                                                </span>

                                                {invitation?.invitation_created_at && (
                                                    <span className="staff-secondary-text">
                                                        {formatDate(
                                                            invitation.invitation_created_at
                                                        )}
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                <div className="staff-row-actions">
                                                    {isActive && !isAccepted && (
                                                        <button
                                                            type="button"
                                                            className="staff-link-button"
                                                            disabled={
                                                                sendingInvitationId ===
                                                                member.id ||
                                                                !member.email
                                                            }
                                                            title={
                                                                member.email
                                                                    ? "Send or resend invitation"
                                                                    : "Add an official email before inviting"
                                                            }
                                                            onClick={() =>
                                                                handleSendInvitation(
                                                                    member
                                                                )
                                                            }
                                                        >
                                                            {sendingInvitationId ===
                                                            member.id
                                                                ? "Sending..."
                                                                : invitationStatus ===
                                                                    "not_invited"
                                                                  ? "Invite"
                                                                  : invitationStatus ===
                                                                      "pending"
                                                                    ? "Resend"
                                                                    : "Invite again"}
                                                        </button>
                                                    )}

                                                    {isAccepted && (
                                                        <span className="staff-secondary-text">
                                                            Account created
                                                        </span>
                                                    )}

                                                    {isActive ? (
                                                        <button
                                                            type="button"
                                                            className="staff-danger-button"
                                                            disabled={
                                                                processingId ===
                                                                member.id
                                                            }
                                                            onClick={() =>
                                                                setStaffToDeactivate(
                                                                    member
                                                                )
                                                            }
                                                        >
                                                            Deactivate
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="staff-link-button"
                                                            disabled={
                                                                processingId ===
                                                                member.id
                                                            }
                                                            onClick={() =>
                                                                handleReactivate(
                                                                    member
                                                                )
                                                            }
                                                        >
                                                            {processingId ===
                                                            member.id
                                                                ? "Working..."
                                                                : "Reactivate"}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="staff-panel-footer">
                    <span>
                        Showing {filteredStaff.length} of {staff.length} staff
                        records
                    </span>

                    <button
                        type="button"
                        className="staff-refresh-button"
                        onClick={loadData}
                        disabled={loading}
                    >
                        Refresh
                    </button>
                </div>
            </section>

            {staffToDeactivate && (
                <div
                    className="staff-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setStaffToDeactivate(null);
                        }
                    }}
                >
                    <section
                        className="staff-confirm-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="staff-confirm-title"
                    >
                        <h2 id="staff-confirm-title">Deactivate staff member?</h2>

                        <p>
                            This will deactivate{" "}
                            <strong>
                                {staffToDeactivate.first_name}{" "}
                                {staffToDeactivate.last_name}
                            </strong>
                            . Their staff record will be retained. You can
                            reactivate them later.
                        </p>

                        <div className="staff-form-actions">
                            <button
                                type="button"
                                className="staff-secondary-button"
                                onClick={() => setStaffToDeactivate(null)}
                                disabled={processingId === staffToDeactivate.id}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="staff-danger-confirm-button"
                                onClick={handleDeactivate}
                                disabled={processingId === staffToDeactivate.id}
                            >
                                {processingId === staffToDeactivate.id
                                    ? "Deactivating..."
                                    : "Deactivate staff"}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
};

export default StaffManagement;
