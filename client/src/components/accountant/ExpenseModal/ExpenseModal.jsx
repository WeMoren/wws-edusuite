import React, { useState } from "react";
import "./ExpenseModal.css";




const ExpenseModal = ({expense, onClose, onAddExpense }) => {
  const [expenseData, setExpenseData] = useState({
    title: expense?.title || "",
    amount: expense?.amount || "",
    category: expense?.category || "Utilities",
    description: expense?.description || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setExpenseData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onAddExpense({
      ...expenseData,
      id:expense?.id,
      amount: Number(expenseData.amount),
      date: expense?.date  || new Date().toISOString(),
    });
  };

  return (
    <div className="expense-modal">
      <div className="expense-modal__content">
        <div className="expense-modal__header">
          <h2> {expense ? "Edit Expense" : "Record Expense"}</h2>

          <button
            type="button"
            className="expense-modal__close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="expense-form__group">
            <label htmlFor="title">Expense</label>

            <input
              id="title"
              name="title"
              type="text"
              value={expenseData.title}
              onChange={handleChange}
              placeholder="e.g. Electricity Bill"
              required
            />
          </div>

          <div className="expense-form__group">
            <label htmlFor="amount">Amount</label>

            <input
              id="amount"
              name="amount"
              type="number"
              min="0"
              value={expenseData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              required
            />
          </div>

          <div className="expense-form__group">
            <label htmlFor="category">Category</label>

            <select
              id="category"
              name="category"
              value={expenseData.category}
              onChange={handleChange}
            >
              <option value="Utilities">Utilities</option>
              <option value="Supplies">Supplies</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Salaries">Salaries</option>
              <option value="Transport">Transport</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="expense-form__group">
            <label htmlFor="description">Description</label>

            <textarea
              id="description"
              name="description"
              value={expenseData.description}
              onChange={handleChange}
              placeholder="Optional description"
              rows="3"
            />
          </div>

          <div className="expense-modal__actions">
            <button
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button type="submit">
                 {expense ? "Edit Expense" : "Record Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;