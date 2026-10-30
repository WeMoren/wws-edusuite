import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import NotificationDialog from "../../components/common/NotificationDialog/NotificationDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import "./SchoolFees.css";

const API_BASE_URL = "http://localhost:5000/api";

const EMPTY_FORM = {
    academicSessionId: "",
    termId: "",
    academicLevelId: "",
    name: "",
    isCurrent: true,
    items: [{ name: "", amount: "", displayOrder: 1 }],
};

const formatMoney = (value) =>
    new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const formatDate = (value) => {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const SchoolFees = () => {
    const { authToken } = useAuth();

    const [sessions, setSessions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [levels, setLevels] = useState([]);
    const [feeStructures, setFeeStructures] = useState([]);

    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");
    const [notification, setNotification] = useState(null);
    const [structureToDelete, setStructureToDelete] = useState(null);

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
            const [
                sessionsData,
                termsData,
                levelsData,
                structuresData,
            ] = await Promise.all([
                request("/academic-sessions"),
                request("/terms"),
                request("/academic-levels"),
                request("/fee-structures"),
            ]);

            setSessions(sessionsData.sessions || []);
            setTerms(termsData.terms || []);
            setLevels(levelsData.levels || []);
            setFeeStructures(structuresData.feeStructures || []);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, [request]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const selectedTerms = useMemo(
        () =>
            terms.filter(
                (term) =>
                    term.academic_session_id === form.academicSessionId
            ),
        [terms, form.academicSessionId]
    );

    const totalAmount = useMemo(
        () =>
            form.items.reduce(
                (total, item) => total + (Number(item.amount) || 0),
                0
            ),
        [form.items]
    );

    const filteredStructures = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        if (!query) return feeStructures;

        return feeStructures.filter((structure) =>
            [
                structure.name,
                structure.academic_session_name,
                structure.term_name,
                structure.academic_level_name,
            ].some((value) =>
                String(value || "").toLowerCase().includes(query)
            )
        );
    }, [feeStructures, searchTerm]);

    const updateField = (event) => {
        const { name, value, type, checked } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value,
            ...(name === "academicSessionId"
                ? { termId: "" }
                : {}),
        }));
    };

    const updateItem = (index, field, value) => {
        setForm((previous) => ({
            ...previous,
            items: previous.items.map((item, itemIndex) =>
                itemIndex === index
                    ? { ...item, [field]: value }
                    : item
            ),
        }));
    };

    const addItem = () => {
        setForm((previous) => ({
            ...previous,
            items: [
                ...previous.items,
                {
                    name: "",
                    amount: "",
                    displayOrder: previous.items.length + 1,
                },
            ],
        }));
    };

    const removeItem = (index) => {
        setForm((previous) => ({
            ...previous,
            items: previous.items
                .filter((_, itemIndex) => itemIndex !== index)
                .map((item, itemIndex) => ({
                    ...item,
                    displayOrder: itemIndex + 1,
                })),
        }));
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
    };

    const handleEdit = async (structure) => {
        setError("");

        try {
            const data = await request(`/fee-structures/${structure.id}`);
            const selected = data.feeStructure;

            setForm({
                academicSessionId: selected.academic_session_id,
                termId: selected.term_id,
                academicLevelId: selected.academic_level_id,
                name: selected.name,
                isCurrent: selected.is_current,
                items: (selected.items || []).map((item, index) => ({
                    name: item.name,
                    amount: String(Number(item.amount)),
                    displayOrder: item.display_order || index + 1,
                })),
            });

            setEditingId(selected.id);

            document
                .querySelector(".school-fees__editor")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (requestError) {
            setNotification({
                title: "Unable to open fee structure",
                message: requestError.message,
            });
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.name.trim()) {
            setError("Enter a name for this fee structure.");
            return;
        }

        if (
            !form.academicSessionId ||
            !form.termId ||
            !form.academicLevelId
        ) {
            setError("Select an academic session, term, and academic level.");
            return;
        }

        if (form.items.length === 0) {
            setError("Add at least one fee item.");
            return;
        }

        const cleanedItems = form.items.map((item, index) => ({
            name: item.name.trim(),
            amount: Number(item.amount),
            displayOrder: index + 1,
        }));

        const invalidItem = cleanedItems.some(
            (item) =>
                !item.name ||
                item.amount < 0 ||
                !Number.isFinite(item.amount) ||
                item.amount === null ||
                item.name.length === 0
        );

        if (invalidItem) {
            setError(
                "Every fee item needs a name and a valid, non-negative amount."
            );
            return;
        }

        const itemNames = cleanedItems.map((item) =>
            item.name.toLowerCase()
        );

        if (new Set(itemNames).size !== itemNames.length) {
            setError("Each fee item must have a unique name.");
            return;
        }

        setSaving(true);

        try {
            if (editingId) {
                await request(`/fee-structures/${editingId}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        name: form.name.trim(),
                        isCurrent: form.isCurrent,
                        items: cleanedItems,
                    }),
                });

                setNotification({
                    title: "Fee structure updated",
                    message: "Your changes have been saved successfully.",
                });
            } else {
                await request("/fee-structures", {
                    method: "POST",
                    body: JSON.stringify({
                        academicSessionId: form.academicSessionId,
                        termId: form.termId,
                        academicLevelId: form.academicLevelId,
                        name: form.name.trim(),
                        isCurrent: form.isCurrent,
                        items: cleanedItems,
                    }),
                });

                setNotification({
                    title: "Fee structure created",
                    message: "The new fee structure has been saved.",
                });
            }

            resetForm();
            await loadData();
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!structureToDelete) return;

        setDeletingId(structureToDelete.id);
        setError("");

        try {
            await request(`/fee-structures/${structureToDelete.id}`, {
                method: "DELETE",
            });

            if (editingId === structureToDelete.id) {
                resetForm();
            }

            setStructureToDelete(null);
            setNotification({
                title: "Fee structure deleted",
                message: "The fee structure has been deleted.",
            });

            await loadData();
        } catch (requestError) {
            setStructureToDelete(null);
            setNotification({
                title: "Unable to delete fee structure",
                message: requestError.message,
            });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="school-fees">
            <header className="school-fees__header">
                <div>
                    <p className="school-fees__eyebrow">FINANCE SETUP</p>
                    <h1>School Fees</h1>
                    <p className="school-fees__subtitle">
                        Configure fee structures by academic session, term,
                        and academic level.
                    </p>
                </div>

                <button
                    type="button"
                    className="school-fees__secondary-button"
                    onClick={loadData}
                    disabled={loading}
                >
                    {loading ? "Refreshing…" : "Refresh"}
                </button>
            </header>

            {error && (
                <div className="school-fees__error" role="alert">
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

            <section className="school-fees__summary">
                <div className="school-fees__summary-card">
                    <span className="school-fees__summary-icon">₦</span>
                    <div>
                        <p>Total fee structures</p>
                        <strong>{feeStructures.length}</strong>
                    </div>
                </div>

                <div className="school-fees__summary-card">
                    <span className="school-fees__summary-icon">✓</span>
                    <div>
                        <p>Current structures</p>
                        <strong>
                            {feeStructures.filter((item) => item.is_current).length}
                        </strong>
                    </div>
                </div>
            </section>

            <section className="school-fees__panel school-fees__editor">
                <div className="school-fees__panel-heading">
                    <div>
                        <h2>
                            {editingId ? "Edit fee structure" : "Create fee structure"}
                        </h2>
                        <p>
                            {editingId
                                ? "Academic session, term, and level cannot be changed after creation."
                                : "Set the applicable academic period and add its fee items."}
                        </p>
                    </div>

                    {editingId && (
                        <button
                            type="button"
                            className="school-fees__text-button"
                            onClick={resetForm}
                        >
                            Cancel editing
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="school-fees__form-grid">
                        <label>
                            Academic session
                            <select
                                name="academicSessionId"
                                value={form.academicSessionId}
                                onChange={updateField}
                                disabled={Boolean(editingId) || saving}
                                required
                            >
                                <option value="">Select session</option>
                                {sessions.map((session) => (
                                    <option key={session.id} value={session.id}>
                                        {session.name}
                                        {session.is_current ? " (Current)" : ""}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Term
                            <select
                                name="termId"
                                value={form.termId}
                                onChange={updateField}
                                disabled={Boolean(editingId) || saving || !form.academicSessionId}
                                required
                            >
                                <option value="">Select term</option>
                                {selectedTerms.map((term) => (
                                    <option key={term.id} value={term.id}>
                                        {term.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Academic level
                            <select
                                name="academicLevelId"
                                value={form.academicLevelId}
                                onChange={updateField}
                                disabled={Boolean(editingId) || saving}
                                required
                            >
                                <option value="">Select level</option>
                                {levels.map((level) => (
                                    <option key={level.id} value={level.id}>
                                        {level.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Fee structure name
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={updateField}
                                placeholder="e.g. Standard school fees"
                                maxLength={150}
                                disabled={saving}
                                required
                            />
                        </label>
                    </div>

                    <div className="school-fees__items-heading">
                        <div>
                            <h3>Fee items</h3>
                            <p>Add each charge separately.</p>
                        </div>

                        <button
                            type="button"
                            className="school-fees__secondary-button"
                            onClick={addItem}
                            disabled={saving}
                        >
                            + Add item
                        </button>
                    </div>

                    <div className="school-fees__items">
                        {form.items.map((item, index) => (
                            <div className="school-fees__item-row" key={index}>
                                <label>
                                    <span>Item {index + 1}</span>
                                    <input
                                        type="text"
                                        value={item.name}
                                        onChange={(event) =>
                                            updateItem(index, "name", event.target.value)
                                        }
                                        placeholder="e.g. Tuition"
                                        maxLength={150}
                                        disabled={saving}
                                        required
                                    />
                                </label>

                                <label>
                                    <span>Amount (₦)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.amount}
                                        onChange={(event) =>
                                            updateItem(index, "amount", event.target.value)
                                        }
                                        placeholder="0.00"
                                        disabled={saving}
                                        required
                                    />
                                </label>

                                <button
                                    type="button"
                                    className="school-fees__remove-button"
                                    onClick={() => removeItem(index)}
                                    disabled={saving || form.items.length === 1}
                                    aria-label={`Remove fee item ${index + 1}`}
                                    title="Remove item"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="school-fees__total">
                        <span>Total structure amount</span>
                        <strong>{formatMoney(totalAmount)}</strong>
                    </div>

                    <label className="school-fees__current-toggle">
                        <input
                            type="checkbox"
                            name="isCurrent"
                            checked={form.isCurrent}
                            onChange={updateField}
                            disabled={saving}
                        />
                        <span>
                            <strong>Mark as current</strong>
                            <small>
                                Use this to identify the fee structure currently in use.
                            </small>
                        </span>
                    </label>

                    <div className="school-fees__form-actions">
                        <button
                            type="button"
                            className="school-fees__secondary-button"
                            onClick={resetForm}
                            disabled={saving}
                        >
                            Clear form
                        </button>

                        <button
                            type="submit"
                            className="school-fees__primary-button"
                            disabled={saving || loading}
                        >
                            {saving
                                ? "Saving…"
                                : editingId
                                  ? "Save changes"
                                  : "Create fee structure"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="school-fees__panel">
                <div className="school-fees__panel-heading school-fees__list-heading">
                    <div>
                        <h2>Fee structures</h2>
                        <p>
                            {filteredStructures.length} of {feeStructures.length} structures
                        </p>
                    </div>

                    <input
                        className="school-fees__search"
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search structures…"
                        aria-label="Search fee structures"
                    />
                </div>

                {loading ? (
                    <div className="school-fees__state">
                        <span className="school-fees__spinner" />
                        <p>Loading fee structures…</p>
                    </div>
                ) : error && feeStructures.length === 0 ? (
                    <div className="school-fees__state">
                        <h3>We couldn't load your fee structures</h3>
                        <p>{error}</p>
                        <button
                            type="button"
                            className="school-fees__primary-button"
                            onClick={loadData}
                        >
                            Try again
                        </button>
                    </div>
                ) : filteredStructures.length === 0 ? (
                    <div className="school-fees__state">
                        <span className="school-fees__empty-icon">₦</span>
                        <h3>
                            {searchTerm
                                ? "No matching fee structures"
                                : "No fee structures yet"}
                        </h3>
                        <p>
                            {searchTerm
                                ? "Try a different search term."
                                : "Create a fee structure above to get started."}
                        </p>
                    </div>
                ) : (
                    <div className="school-fees__table-wrap">
                        <table className="school-fees__table">
                            <thead>
                                <tr>
                                    <th>Structure</th>
                                    <th>Academic period</th>
                                    <th>Academic level</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredStructures.map((structure) => (
                                    <tr key={structure.id}>
                                        <td>
                                            <strong>{structure.name}</strong>
                                            <small>
                                                Updated {formatDate(structure.updated_at)}
                                            </small>
                                        </td>
                                        <td>
                                            <span>{structure.academic_session_name}</span>
                                            <small>{structure.term_name}</small>
                                        </td>
                                        <td>{structure.academic_level_name}</td>
                                        <td>{structure.item_count}</td>
                                        <td className="school-fees__amount">
                                            {formatMoney(structure.total_amount)}
                                        </td>
                                        <td>
                                            <span
                                                className={`school-fees__status ${
                                                    structure.is_current
                                                        ? "school-fees__status--current"
                                                        : "school-fees__status--inactive"
                                                }`}
                                            >
                                                {structure.is_current
                                                    ? "Current"
                                                    : "Inactive"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="school-fees__row-actions">
                                                <button
                                                    type="button"
                                                    className="school-fees__text-button"
                                                    onClick={() => handleEdit(structure)}
                                                    disabled={saving || deletingId !== null}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="school-fees__danger-text"
                                                    onClick={() =>
                                                        setStructureToDelete(structure)
                                                    }
                                                    disabled={saving || deletingId !== null}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <p className="school-fees__footnote">
                Fee structures define school charges; they do not collect payments.
                Accountants record payments received by the school separately.
            </p>

            {notification && (
                <NotificationDialog
                    title={notification.title}
                    message={notification.message}
                    onClose={() => setNotification(null)}
                />
            )}

            {structureToDelete && (
                <ConfirmDialog
                    title="Delete fee structure"
                    message={`Delete "${structureToDelete.name}"? This action cannot be undone. If financial accounts reference this structure, the server may prevent deletion.`}
                    onCancel={() => setStructureToDelete(null)}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
};

export default SchoolFees;
