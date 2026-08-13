import React, { useState } from "react";
import "./ParentModal.css";
const ParentModal = ({ onClose, onAddParent, editingParent }) => {
  const [parentData, setParentData] = useState(
    editingParent || {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setParentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onAddParent(parentData);
  };

  return (
    <div className="parent-modal__overlay">
      <div className="parent-modal">
        <div className="parent-modal__header">
          <h2>
            {editingParent ? "Edit Parent" : "Add Parent"}
          </h2>

          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="parent-form__group">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={parentData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="parent-form__group">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={parentData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="parent-form__group">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={parentData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="parent-form__group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={parentData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="parent-form__group">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              type="text"
              value={parentData.address}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit">
                {editingParent ? "Saved Changes" : "Add Parent"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ParentModal;