import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import ParentTable from "../../components/parents/ParentTable/ParentTable";
import ParentModal from "../../components/parents/ParentModal/ParentModal";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import "./Parents.css";

const API_BASE_URL = "http://localhost:5000/api";

const normalizeParent = (parent) => {
  const children = Array.isArray(parent.children) ? parent.children : [];

  return {
    id: parent.id,
    firstName: parent.firstName ?? parent.first_name ?? "",
    lastName: parent.lastName ?? parent.last_name ?? "",
    phone: parent.phone ?? "",
    email: parent.email ?? "",
    address: parent.address ?? "",
    children: children.map((child) => {
      if (typeof child === "string") return child;

      const name = [
        child.first_name ?? child.firstName ?? "",
        child.last_name ?? child.lastName ?? "",
      ].filter(Boolean).join(" ");

      return child.admission_no
        ? `${name} (${child.admission_no})`
        : name || "Unnamed student";
    }),
    studentIds: children
      .filter((child) => child && typeof child === "object" && child.id)
      .map((child) => child.id),
    relationship: children.find((child) => child?.relationship)?.relationship
      ?? "Guardian",
  };
};

const Parents = () => {
  const { currentUser, authToken } = useAuth();

  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentsError, setStudentsError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [parentToDelete, setParentToDelete] = useState(null);
  const [editingParent, setEditingParent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const parentsPerPage = 5;

  const userRoles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : currentUser?.role
      ? [currentUser.role]
      : [];

  const canAccessParents = userRoles.some(
    (role) => String(role).trim().toLowerCase() === "principal"
  );

  const apiRequest = useCallback(async (path, options = {}) => {
    if (!authToken) {
      throw new Error("Your session has expired. Please log in again.");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
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
  }, [authToken]);

  const loadParents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/parents");
      setParents(
        Array.isArray(data.parents)
          ? data.parents.map(normalizeParent)
          : []
      );
    } catch (requestError) {
      setError(requestError.message || "Failed to load parents.");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    setStudentsError("");

    try {
      const data = await apiRequest("/students");
      setStudents(Array.isArray(data.students) ? data.students : []);
    } catch (requestError) {
      setStudentsError(
        requestError.message || "Failed to load students."
      );
    } finally {
      setStudentsLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    if (!canAccessParents) {
      setLoading(false);
      setStudentsLoading(false);
      return;
    }

    loadParents();
    loadStudents();
  }, [canAccessParents, loadParents, loadStudents]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredParents = parents.filter((parent) => {
    const search = searchTerm.trim().toLowerCase();

    return (
      `${parent.firstName} ${parent.lastName}`.toLowerCase().includes(search) ||
      parent.phone.toLowerCase().includes(search) ||
      parent.email.toLowerCase().includes(search) ||
      parent.address.toLowerCase().includes(search) ||
      parent.children.join(" ").toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil(filteredParents.length / parentsPerPage);
  const safeCurrentPage = Math.min(
    currentPage,
    Math.max(totalPages, 1)
  );
  const startIndex = (safeCurrentPage - 1) * parentsPerPage;
  const currentParents = filteredParents.slice(
    startIndex,
    startIndex + parentsPerPage
  );

  const openAddModal = () => {
    setEditingParent(null);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (parent) => {
    setEditingParent(parent);
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingParent(null);
    setFormError("");
  };

  const handleSaveParent = async (parentData) => {
    setSaving(true);
    setFormError("");

    const payload = {
      firstName: parentData.firstName.trim(),
      lastName: parentData.lastName.trim(),
      phone: parentData.phone.trim(),
      email: parentData.email.trim() || null,
      address: parentData.address.trim() || null,
      studentIds: parentData.studentIds,
      relationship: parentData.relationship,
    };

    try {
      if (editingParent) {
        await apiRequest(`/parents/${editingParent.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/parents", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      await loadParents();
      setShowModal(false);
      setEditingParent(null);
    } catch (requestError) {
      setFormError(requestError.message || "Failed to save parent.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteParent = async () => {
    if (!parentToDelete || deleting) return;

    setDeleting(true);
    setError("");

    try {
      await apiRequest(`/parents/${parentToDelete.id}`, {
        method: "DELETE",
      });

      setParentToDelete(null);
      await loadParents();
    } catch (requestError) {
      setError(requestError.message || "Failed to delete parent.");
    } finally {
      setDeleting(false);
    }
  };

  if (!canAccessParents) {
    return (
      <div className="parents-page">
        <h1>Access Denied</h1>
        <p>You do not have permission to access the Parents module.</p>
      </div>
    );
  }

  return (
    <div className="parents-page">
      <div className="parents-page__header">
        <h1>Parents</h1>

        <button
          type="button"
          className="parents-page__button"
          onClick={openAddModal}
        >
          + Add Parent
        </button>
      </div>

      <div className="parents-page__filters">
        <input
          type="search"
          placeholder="Search parents or children..."
          aria-label="Search parents or children"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {error && (
        <div className="parents-page__message parents-page__message--error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={loadParents}>Try again</button>
        </div>
      )}

      {loading ? (
        <p role="status">Loading parents...</p>
      ) : !error && currentParents.length === 0 ? (
        <div className="parents-page__empty">
          <p>
            {searchTerm
              ? "No parents match your search."
              : "No parents have been added yet."}
          </p>
          {!searchTerm && (
            <button
              type="button"
              className="parents-page__button"
              onClick={openAddModal}
            >
              + Add Parent
            </button>
          )}
        </div>
      ) : (
        <ParentTable
          parents={currentParents}
          rowOffset={startIndex}
          onEdit={openEditModal}
          onDelete={(parentId) => {
            const parent = parents.find((item) => item.id === parentId);
            if (parent) setParentToDelete(parent);
          }}
        />
      )}

      {!loading && totalPages > 1 && (
        <div className="parents-page__pagination">
          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={safeCurrentPage === 1}
          >
            Previous
          </button>

          <span>Page {safeCurrentPage} of {totalPages}</span>

          <button
            type="button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={safeCurrentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <ParentModal
          key={editingParent?.id ?? "new-parent"}
          editingParent={editingParent}
          students={students}
          studentsLoading={studentsLoading}
          studentsError={studentsError}
          onRetryStudents={loadStudents}
          saving={saving}
          error={formError}
          onClose={closeModal}
          onAddParent={handleSaveParent}
        />
      )}

      {parentToDelete && (
        <ConfirmDialog
          title="Delete Parent"
          message={`Are you sure you want to delete ${parentToDelete.firstName} ${parentToDelete.lastName}? This action cannot be undone.`}
          onCancel={() => {
            if (!deleting) setParentToDelete(null);
          }}
          onConfirm={handleDeleteParent}
        />
      )}

      {deleting && <p role="status">Deleting parent...</p>}
    </div>
  );
};

export default Parents;
