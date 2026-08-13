import React from "react";
import "./FinanceAction.css";
const FinanceAction = ({ label, description, onClick }) => {
  return (
    <button
      className="finance-action"
      type="button"
      onClick={onClick}
    >
      <span className="finance-action__label">
        {label}
      </span>

      <span className="finance-action__description">
        {description}
      </span>
    </button>
  );
};

export default FinanceAction;