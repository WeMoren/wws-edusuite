
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import "./PaymentModal.css";

const PaymentModal = ({
  payment,
  financialAccounts,
  error,
  onClose,
  onAddPayment,
}) => {
  const { students } = useOutletContext();
  console.log("PAYMENT MODAL DIAGNOSTICS:", {
  students: students.map((student) => ({
    id: student.id,
    name: `${student.firstName} ${student.lastName}`,
  })),
  financialAccounts: financialAccounts.map((account) => ({
    id: account.id,
    student_id: account.student_id,
    session: account.academic_session_name,
    term: account.term_name,
  })),
});

  const isEditing = Boolean(payment);

  const getStudentFullName = (student) =>
    [
      student?.firstName,
      student?.middleName,
      student?.lastName,
    ]
      .filter(
        (name) =>
          typeof name === "string" && name.trim() !== ""
      )
      .map((name) => name.trim())
      .join(" ");

  const getPaymentMethod = (method) => {
    const normalizedMethod = String(method || "cash").toLowerCase();

    const methodMap = {
      "bank transfer": "transfer",
      card: "pos",
    };

    return methodMap[normalizedMethod] || normalizedMethod;
  };

  const [paymentData, setPaymentData] = useState({
    studentId: payment?.studentId || payment?.student_id || "",
    financialAccountId:
      payment?.financialAccountId ||
      payment?.financial_account_id ||
      "",
    amount: payment?.amount ?? "",
    paymentMethod: getPaymentMethod(
      payment?.paymentMethod || payment?.payment_method
    ),
    paymentDate: (
      payment?.paymentDate ||
      payment?.payment_date ||
      payment?.date ||
      new Date().toISOString()
    ).slice(0, 10),
    reference:
      payment?.reference ||
      payment?.payment_reference ||
      "",
    description:
      payment?.description ||
      payment?.payment_description ||
      "",
    reason: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setPaymentData((prevData) => ({
      ...prevData,
      [name]: value,
      ...(name === "studentId"
        ? { financialAccountId: "" }
        : {}),
    }));
  };

  const studentFinancialAccounts = financialAccounts.filter(
    (account) =>
      account.student_id === paymentData.studentId
  );

  const selectedFinancialAccount = studentFinancialAccounts.find(
    (account) =>
      account.id === paymentData.financialAccountId
  );

  const outstandingBalance = selectedFinancialAccount
    ? Math.max(
        Number(selectedFinancialAccount.total_due) -
          Number(selectedFinancialAccount.total_paid),
        0
      )
    : 0;

  const maximumAmount = isEditing
    ? outstandingBalance + Number(payment.amount)
    : outstandingBalance;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!paymentData.financialAccountId) {
      return;
    }

    const amount = Number(paymentData.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > maximumAmount
    ) {
      return;
    }

    if (isEditing && !paymentData.reason.trim()) {
      return;
    }

    const selectedStudent = students.find(
      (student) => student.id === paymentData.studentId
    );

    onAddPayment({
      ...paymentData,
      id: payment?.id,
      studentId: paymentData.studentId,
      financialAccountId: paymentData.financialAccountId,
      studentName: getStudentFullName(selectedStudent),
      amount,
      paymentDate: paymentData.paymentDate,
      paymentMethod: paymentData.paymentMethod,
      reference: paymentData.reference.trim(),
      description: paymentData.description.trim(),
      reason: paymentData.reason.trim(),
    });
  };

  return (
    <div className="payment-modal__overlay">
      <div className="payment-modal">
        <div className="payment-modal__header">
          <h2>
            {isEditing ? "Correct Payment" : "Record Payment"}
          </h2>

          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="payment-form__error" role="alert">
              {error}
            </div>
          )}

          <div className="payment-form__group">
            <label htmlFor="studentId">Student</label>

            <select
              id="studentId"
              name="studentId"
              value={paymentData.studentId}
              onChange={handleChange}
              required
              disabled={isEditing}
            >
              <option value="">Select a student</option>

              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {getStudentFullName(student)}
                </option>
              ))}
            </select>
          </div>

          <div className="payment-form__group">
            <label htmlFor="financialAccountId">Fee Account</label>

            <select
              id="financialAccountId"
              name="financialAccountId"
              value={paymentData.financialAccountId}
              onChange={handleChange}
              required
              disabled={isEditing || !paymentData.studentId}
            >
              <option value="">Select session and term</option>

              {studentFinancialAccounts.map((account) => {
                const outstanding = Math.max(
                  Number(account.total_due) -
                    Number(account.total_paid),
                  0
                );

                return (
                  <option
                    key={account.id}
                    value={account.id}
                    disabled={!isEditing && outstanding <= 0}
                  >
                    {account.academic_session_name} — {account.term_name}
                    {" "}(Outstanding: ₦{outstanding.toLocaleString()})
                  </option>
                );
              })}
            </select>

            {selectedFinancialAccount && (
              <small>
                Current outstanding balance: ₦
                {outstandingBalance.toLocaleString()}
              </small>
            )}
          </div>

          <div className="payment-form__group">
            <label htmlFor="amount">Amount</label>

            <input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              max={maximumAmount}
              value={paymentData.amount}
              onChange={handleChange}
              required
            />

            {isEditing && (
              <small>
                Maximum corrected amount: ₦
                {maximumAmount.toLocaleString()}
              </small>
            )}
          </div>

          <div className="payment-form__group">
            <label htmlFor="paymentDate">Payment Date</label>

            <input
              id="paymentDate"
              name="paymentDate"
              type="date"
              value={paymentData.paymentDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="payment-form__group">
            <label htmlFor="paymentMethod">Payment Method</label>

            <select
              id="paymentMethod"
              name="paymentMethod"
              value={paymentData.paymentMethod}
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

          <div className="payment-form__group">
            <label htmlFor="reference">Payment Reference</label>

            <input
              id="reference"
              name="reference"
              type="text"
              value={paymentData.reference}
              onChange={handleChange}
            />
          </div>

          <div className="payment-form__group">
            <label htmlFor="description">Description</label>

            <input
              id="description"
              name="description"
              type="text"
              value={paymentData.description}
              onChange={handleChange}
            />
          </div>

          {isEditing && (
            <div className="payment-form__group">
              <label htmlFor="reason">
                Reason for Correction
              </label>

              <textarea
                id="reason"
                name="reason"
                value={paymentData.reason}
                onChange={handleChange}
                placeholder="Explain why this payment is being corrected..."
                required
                rows={3}
              />
            </div>
          )}

          <button type="submit">
            {isEditing ? "Save Correction" : "Record Payment"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
