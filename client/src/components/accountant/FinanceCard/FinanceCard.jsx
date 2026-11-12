
import React from "react";
import "./FinanceCard.css";

const FinanceCard = ({ title, value, description, variant = "blue" }) => {
  return (
    <div className={`finance-card finance-card--${variant}`}>
      <h3>{title}</h3>

      <p className="finance-card__value">
        {value}
      </p>

      <span className="finance-card__description">
        {description}
      </span>
    </div>
  );
};

export default FinanceCard;
