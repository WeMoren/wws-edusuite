import React from "react";
import "./TransactionTable.css";




const TransactionTable = ({ payments, onEdit, onDelete, onReceipt }) => {
  return (
    <div className="transaction-table-wrapper">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Student</th>
            <th>Amount</th>
            <th>Payment Method</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {payments.length > 0 ? (
            payments.map((payment) => (
              <tr key={payment.id}>
                <td>
                    {new Date(payment.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    })}
                </td>

                <td>{payment.studentName}</td>

                <td>
                  ₦{payment.amount.toLocaleString()}
                </td>

                <td>
                    <span
                        className={`transaction-table__method transaction-table__method--${payment.paymentMethod
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                        {payment.paymentMethod}
                    </span>
                </td>

                <td>{payment.description || "—"}</td>

                <td>
                    <div className="transaction-table__actions">

                        <button
                            type="button"
                            className="transaction-table__receipt"
                            onClick={() => onReceipt(payment)}
                        >
                            Receipt
                        </button>

                        <button
                        type="button"
                        className="transaction-table__edit"
                          onClick={() => onEdit(payment)}
                        >
                        Edit
                        </button>

                        <button
                        type="button"
                        className="transaction-table__delete"
                        onClick={() => onDelete(payment)}
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
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;