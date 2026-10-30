import React, { useState } from "react";
import "./ParentModal.css";

const RELATIONSHIPS = [
  "Mother",
  "Father",
  "Guardian",
  "Step-parent",
  "Grandparent",
  "Aunt",
  "Uncle",
  "Other",
];

const ParentModal = ({
  onClose,
  onAddParent,
  editingParent,
  students = [],
  studentsLoading = false,
  studentsError = "",
  onRetryStudents,
  saving = false,
  error = "",
}) => {
  const [parentData, setParentData] = useState({
    firstName: editingParent?.firstName ?? "",
    lastName: editingParent?.lastName ?? "",
    phone: editingParent?.phone ?? "",
    email: editingParent?.email ?? "",
    address: editingParent?.address ?? "",
    studentIds: editingParent?.studentIds ?? [],
    relationship: editingParent?.relationship ?? "Guardian",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setParentData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleStudentChange = (event) => {
    const selectedIds = Array.from(
      event.target.selectedOptions,
      (option) => option.value
    );

    setParentData((previous) => ({
      ...previous,
      studentIds: selectedIds,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await onAddParent(parentData);
  };

  return (
    <div
      className="parent-modal__overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div
        className="parent-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="parent-modal-title"
      >
        <div className="parent-modal__header">
          <h2 id="parent-modal-title">
            {editingParent ? "Edit Parent" : "Add Parent"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close parent form"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="parent-modal__error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="parent-form__group">
            <label htmlFor="parent-first-name">First Name *</label>
            <input
              id="parent-first-name"
              placeholder="Enter first name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              value={parentData.firstName}
              onChange={handleChange}
              required
              maxLength={100}
              disabled={saving}
            />
          </div>

          <div className="parent-form__group">
            <label htmlFor="parent-last-name">Last Name *</label>
            <input
              id="parent-last-name"
              placeholder="Enter last name"
              name="lastName"
              type="text"
              autoComplete="family-name"
              value={parentData.lastName}
              onChange={handleChange}
              required
              maxLength={100}
              disabled={saving}
            />
          </div>

          <div className="parent-form__group">
            <label htmlFor="parent-phone">Phone *</label>
            <input
              id="parent-phone"
              placeholder="Enter phone number"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={parentData.phone}
              onChange={handleChange}
              required
              maxLength={30}
              disabled={saving}
            />
          </div>

          <div className="parent-form__group">
            <label htmlFor="parent-email">Email (optional)</label>
            <input
              id="parent-email"
              placeholder="Enter email address (optional)"
              name="email"
              type="email"
              autoComplete="email"
              value={parentData.email}
              onChange={handleChange}
              maxLength={255}
              disabled={saving}
            />
          </div>

          <div className="parent-form__group">
            <label htmlFor="parent-address">Address (optional)</label>
            <input
              id="parent-address"
              placeholder="Enter residential address (optional)"
              name="address"
              type="text"
              autoComplete="street-address"
              value={parentData.address}
              onChange={handleChange}
              maxLength={255}
              disabled={saving}
            />
          </div>

          <div className="parent-form__group">
            <label htmlFor="parent-students">Link Students</label>
            <select
              id="parent-students"
              name="studentIds"
              multiple
              size={Math.min(Math.max(students.length, 3), 6)}
              value={parentData.studentIds}
              onChange={handleStudentChange}
              disabled={saving || studentsLoading || Boolean(studentsError)}
              aria-describedby="parent-students-help"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {[
                    student.first_name,
                    student.middle_name,
                    student.last_name,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  {" — "}
                  {student.admission_no}
                  {student.status && student.status !== "active"
                    ? ` (${student.status})`
                    : ""}
                </option>
              ))}
            </select>

            <small id="parent-students-help">
              Select one or more students. Hold Ctrl (Windows) while clicking
              to select multiple students. You may leave this empty.
            </small>

            {studentsLoading && (
              <small role="status">Loading students...</small>
            )}

            {studentsError && (
              <div className="parent-modal__error" role="alert">
                <p>{studentsError}</p>
                <button
                  type="button"
                  onClick={onRetryStudents}
                  disabled={saving}
                >
                  Retry loading students
                </button>
              </div>
            )}

            {!studentsLoading && !studentsError && students.length === 0 && (
              <small>No students are available yet. You can still save the parent.</small>
            )}
          </div>

          <div className="parent-form__group">
            <label htmlFor="parent-relationship">Relationship to student</label>
            <select
              id="parent-relationship"
              name="relationship"
              value={parentData.relationship}
              onChange={handleChange}
              disabled={saving}
            >
              {RELATIONSHIPS.map((relationship) => (
                <option key={relationship} value={relationship}>
                  {relationship}
                </option>
              ))}
            </select>
            <small>
              This relationship will apply to every student selected above.
            </small>
          </div>

          <button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : editingParent
                ? "Save Changes"
                : "Add Parent"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ParentModal;
