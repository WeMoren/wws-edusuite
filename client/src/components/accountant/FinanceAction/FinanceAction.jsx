
import React from "react";
import "./FinanceAction.css";

const FinanceAction = ({ label, description, onClick, variant = "blue" }) => {
  return (
    <button
      className={`finance-action finance-action--${variant}`}
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
