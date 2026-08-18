import React from "react";
import "./NotificationDialog.css";

const NotificationDialog = ({
  title = "Notification",
  message = "",
  onClose,
}) => {
  return (
    <div
      className="notification-dialog__overlay"
      onClick={onClose}
    >
      <div
        className="notification-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>

        <p>{message}</p>

        <div className="notification-dialog__actions">
          <button
            type="button"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDialog;