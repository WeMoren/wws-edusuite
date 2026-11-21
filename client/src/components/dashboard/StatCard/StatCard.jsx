
import React from "react";
import "./StatCard.css";

const StatCard = ({ title, value, icon: Icon }) => {
  return (
    <article className="stat-card">
      <div className="stat-card__content">
        <p className="stat-card__title">{title}</p>
        <p className="stat-card__value">{value}</p>
      </div>

      {Icon && (
        <div className="stat-card__icon" aria-hidden="true">
          <Icon size={22} strokeWidth={1.8} />
        </div>
      )}
    </article>
  );
};

export default StatCard;
