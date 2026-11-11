import React, { useState } from "react";
import "./ExpenseCategoryModal.css";

const ExpenseCategoryModal = ({
  categories = [],
  authToken,
  apiBaseUrl,
  onClose,
  onCategoriesChange,
}) => {
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmingCategory, setConfirmingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updatingCategoryId, setUpdatingCategoryId] = useState(null);
  const [error, setError] = useState("");

  const resetForm = () => {
    setCategoryName("");
    setDescription("");
    setEditingCategory(null);
    setError("");
  };

  const refreshCategories = async () => {
    const response = await fetch(`${apiBaseUrl}/expense-categories`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Failed to refresh expense categories.");
    }

    onCategoriesChange(Array.isArray(data) ? data : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const isEditing = Boolean(editingCategory);

      const response = await fetch(
        isEditing
          ? `${apiBaseUrl}/expense-categories/${editingCategory.id}`
          : `${apiBaseUrl}/expense-categories`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            name: categoryName.trim(),
            description: description.trim(),
            ...(isEditing && {
              isActive: editingCategory.is_active,
            }),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isEditing
              ? "Failed to update category."
              : "Failed to create category.")
        );
      }

      await refreshCategories();
      resetForm();
    } catch (error) {
      console.error("Expense category operation failed:", error);
      setError(error.message || "Category operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (category) => {
    if (updatingCategoryId) return;

    setUpdatingCategoryId(category.id);
    setError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/expense-categories/${category.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            name: category.name,
            description: category.description || "",
            isActive: !category.is_active,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to update category status.");
      }

      await refreshCategories();
      setConfirmingCategory(null);
    } catch (error) {
      console.error("Expense category status update failed:", error);
      setError(error.message || "Failed to update category status.");
    } finally {
      setUpdatingCategoryId(null);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setDescription(category.description || "");
    setError("");
  };

  return (
    <div className="expense-category-modal">
      <div
        className="expense-category-modal__content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-category-modal-title"
      >
        <div className="expense-category-modal__header">
          <div>
            <h2 id="expense-category-modal-title">
              Manage Expense Categories
            </h2>
            <p>Add, edit, activate, or deactivate expense categories.</p>
          </div>

          <button
            type="button"
            className="expense-category-modal__close"
            onClick={onClose}
            disabled={saving || Boolean(updatingCategoryId)}
            aria-label="Close category manager"
          >
            ×
          </button>
        </div>

        <form
          className="expense-category-form"
          onSubmit={handleSubmit}
        >
          <h3>{editingCategory ? "Edit Category" : "Add New Category"}</h3>

          <div className="expense-category-form__group">
            <label htmlFor="expense-category-name">
              Category Name
            </label>

            <input
              id="expense-category-name"
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Utilities & Services"
              maxLength="100"
              required
              disabled={saving}
            />
          </div>

          <div className="expense-category-form__group">
            <label htmlFor="expense-category-description">
              Description (Optional)
            </label>

            <textarea
              id="expense-category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe this category"
              rows="2"
              disabled={saving}
            />
          </div>

          {error && (
            <p className="expense-category-modal__error" role="alert">
              {error}
            </p>
          )}

          <div className="expense-category-form__actions">
            {editingCategory && (
              <button
                type="button"
                className="expense-category-button expense-category-button--secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel Edit
              </button>
            )}

            <button
              type="submit"
              className="expense-category-button expense-category-button--primary"
              disabled={saving || !categoryName.trim()}
            >
              {saving
                ? "Saving..."
                : editingCategory
                  ? "Update Category"
                  : "Add Category"}
            </button>
          </div>
        </form>

        <div className="expense-category-list">
          <h3>Existing Categories</h3>

          {categories.length === 0 ? (
            <p className="expense-category-list__empty">
              No expense categories have been created yet.
            </p>
          ) : (
            categories.map((category) => (
              <div
                className="expense-category-list__item"
                key={category.id}
              >
                <div className="expense-category-list__details">
                  <strong>{category.name}</strong>

                  {category.description && (
                    <p>{category.description}</p>
                  )}

                  <span
                    className={
                      category.is_active
                        ? "expense-category-status expense-category-status--active"
                        : "expense-category-status expense-category-status--inactive"
                    }
                  >
                    {category.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="expense-category-list__actions">
                  <button
                    type="button"
                    onClick={() => handleEdit(category)}
                    disabled={saving || Boolean(updatingCategoryId)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className={
                      category.is_active
                        ? "expense-category-list__deactivate"
                        : "expense-category-list__activate"
                    }
                    onClick={() => setConfirmingCategory(category)}
                    disabled={saving || Boolean(updatingCategoryId)}
                  >
                    {category.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>

                {confirmingCategory?.id === category.id && (
                  <div className="expense-category-confirm">
                    <p>
                      {category.is_active
                        ? `Deactivate "${category.name}"? It won't be available for new expenses.`
                        : `Activate "${category.name}"? It will become available for new expenses.`}
                    </p>

                    <button
                      type="button"
                      onClick={() => setConfirmingCategory(null)}
                      disabled={updatingCategoryId === category.id}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(category)}
                      disabled={updatingCategoryId === category.id}
                    >
                      {updatingCategoryId === category.id
                        ? "Updating..."
                        : "Confirm"}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseCategoryModal;