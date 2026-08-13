import React from "react";
import "./ExpenseTable.css";

const ExpenseTable = ({ expenses, onEdit, onDelete}) => {
  return (
    <div className="expense-table-wrapper">
      <table className="expense-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Expense</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {expenses.length > 0 ? (
            expenses.map((expense) => (
              <tr key={expense.id}>
                <td>
                  {new Date(expense.date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>

                <td>{expense.title}</td>

                  <td>
                        <span
                            className={`expense-table__category expense-table__category--${expense.category
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                            {expense.category}
                        </span>
                </td>

                <td>
                  ₦{expense.amount.toLocaleString()}
                </td>

                <td>{expense.description || "—"}</td>

                <td>
                  <div className="expense-table__actions">
                    <button
                      type="button"
                      className="expense-table__edit"
                        onClick={() => onEdit(expense)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="expense-table__delete"
                        onClick={() => onDelete(expense)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">
                No expenses found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseTable;