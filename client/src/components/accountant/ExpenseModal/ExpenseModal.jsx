import React, {useEffect, useState } from "react";
import "./ExpenseModal.css";

const getTodayDate = () => {
  const today = new Date();

  return new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);
};

const ExpenseModal = ({
  expense,
  academicSessions = [],
  academicTerms = [],
  categories = [],
  error = "",
  saving = false,
  onClose,
  onAddExpense,
}) => {
  const [expenseData, setExpenseData] = useState({
    title: expense?.title || "",
    amount: expense?.amount ?? "",
    expenseCategoryId:
      expense?.expenseCategoryId ||
      expense?.expense_category_id ||
      "",
    expenseDate: (
      expense?.date ||
      expense?.expense_date ||
      getTodayDate()
    ).slice(0, 10),
    paymentMethod: expense?.paymentMethod || "transfer",
    reference: expense?.reference || "",
    description: expense?.description || "",
  });

  const [academicSessionId, setAcademicSessionId] = useState("");
  const [termId, setTermId] = useState("");

    useEffect(() => {
    if (expense) {
      setAcademicSessionId(
        expense.academicSessionId ||
          expense.academic_session_id ||
          ""
      );

      setTermId(
        expense.termId ||
          expense.term_id ||
          ""
      );

      return;
    }

    if (!academicSessions.length) {
      return;
    }

    const currentSession =
      academicSessions.find((session) => session.isCurrent) ||
      academicSessions[0];

    const sessionTerms = academicTerms
      .filter(
        (term) => term.academicSessionId === currentSession.id
      )
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const defaultTerm =
      sessionTerms.find((term) => term.isCurrent) ||
      sessionTerms[0];

    setAcademicSessionId(currentSession.id);
    setTermId(defaultTerm?.id || "");
  }, [expense, academicSessions, academicTerms]);


    const handleAcademicSessionChange = (sessionId) => {
    setAcademicSessionId(sessionId);

    if (!sessionId) {
      setTermId("");
      return;
    }

    const sessionTerms = academicTerms
      .filter((term) => term.academicSessionId === sessionId)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const defaultTerm =
      sessionTerms.find((term) => term.isCurrent) ||
      sessionTerms[0];

    setTermId(defaultTerm?.id || "");
  };

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
      id: expense?.id,
      amount: Number(expenseData.amount),
      academicSessionId: academicSessionId || null,
      termId: termId || null,
    });
  };

  const existingCategoryIsInactive =
    expense?.expenseCategoryId &&
    !categories.some(
      (category) => category.id === expense.expenseCategoryId
    );

  return (
    <div className="expense-modal">
      <div className="expense-modal__content">
        <div className="expense-modal__header">
          <h2>{expense ? "Edit Expense" : "Record Expense"}</h2>

          <button
            type="button"
            className="expense-modal__close"
            onClick={onClose}
            disabled={saving}
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
              maxLength="150"
              value={expenseData.title}
              onChange={handleChange}
              placeholder="e.g. Electricity Bill"
              required
            />
          </div>

          <div className="expense-form__group">
            <label htmlFor="amount">Amount (₦)</label>

            <input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={expenseData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              required
            />
          </div>

          <div className="expense-form__group">
            <label htmlFor="expenseCategoryId">Category</label>

            <select
              id="expenseCategoryId"
              name="expenseCategoryId"
              value={expenseData.expenseCategoryId}
              onChange={handleChange}
              required
            >
              <option value="">Select expense category</option>

              {existingCategoryIsInactive && (
                <option
                  value={expenseData.expenseCategoryId}
                  disabled
                >
                  {expense.category} (inactive)
                </option>
              )}

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

         <div className="expense-form__group">
            <label htmlFor="academicSessionId">
              Academic Session
            </label>

            <select
              id="academicSessionId"
              value={academicSessionId}
              onChange={(e) =>
                handleAcademicSessionChange(e.target.value)
              }
            >
              <option value="">Unallocated / No Academic Period</option>

              {academicSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>

          <div className="expense-form__group">
            <label htmlFor="termId">Academic Term</label>

            <select
              id="termId"
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              disabled={!academicSessionId}
              required={Boolean(academicSessionId)}
            >
              <option value="">Select academic term</option>

              {academicTerms
                .filter(
                  (term) =>
                    term.academicSessionId === academicSessionId
                )
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
            </select>
          </div>


          <div className="expense-form__group">
            <label htmlFor="expenseDate">Expense Date</label>

            <input
              id="expenseDate"
              name="expenseDate"
              type="date"
              value={expenseData.expenseDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="expense-form__group">
            <label htmlFor="paymentMethod">Payment Method</label>

            <select
              id="paymentMethod"
              name="paymentMethod"
              value={expenseData.paymentMethod}
              onChange={handleChange}
              required
            >
              <option value="cash">Cash</option>
              <option value="transfer">Bank Transfer</option>
              <option value="pos">POS</option>
              <option value="cheque">Cheque</option>
              <option value="ussd">USSD</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="expense-form__group">
            <label htmlFor="reference">Payment Reference</label>

            <input
              id="reference"
              name="reference"
              type="text"
              value={expenseData.reference}
              onChange={handleChange}
              placeholder="Optional transaction reference"
            />
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

          {error && (
            <p role="alert" style={{ color: "#dc2626" }}>
              {error}
            </p>
          )}

          <div className="expense-modal__actions">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : expense
                  ? "Update Expense"
                  : "Record Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;