import React from "react";
import "./ConfirmDialog.css";

const ConfirmDialog = ({
  title = "Confirm Delete",
  message = "Are you sure you want to delete this item?",
  onConfirm,
  onCancel,
  loading = false,
    error = "",
}) => {
  return (
    <div className="confirm-dialog__overlay">
      <div className="confirm-dialog">
        <h2>{title}</h2>

        <p>{message}</p>

        {error && (
          <p className="confirm-dialog__error" role="alert">
            {error}
          </p>
        )}

        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="confirm-dialog__cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="confirm-dialog__delete"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;