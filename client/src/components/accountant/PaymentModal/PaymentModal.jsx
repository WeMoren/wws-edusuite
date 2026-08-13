import React, { useState } from "react";
import "./PaymentModal.css";
import initialStudents from "../../../data/students";

const PaymentModal = ({payment, onClose, onAddPayment }) => {

  const [paymentData, setPaymentData] = useState({
    studentId: payment?.studentId || "",
    amount: payment?.amount || "",
    paymentMethod: payment?.paymentMethod || "Cash",
    description: payment?.description || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setPaymentData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

    const handleSubmit = (e) => {
     e.preventDefault();

    const selectedStudent = initialStudents.find(
    (student) => student.id === Number(paymentData.studentId)
  );

  onAddPayment({
    ...paymentData,
    id: payment?.id,
    studentId: Number(paymentData.studentId),
    studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
    amount: Number(paymentData.amount),
    date: payment?.date || new Date().toISOString(),
  });
};

  return (
    <div className="payment-modal__overlay">
      <div className="payment-modal">
        <div className="payment-modal__header">
          <h2>Record Payment</h2>

          <button
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="payment-form__group">
                    <label htmlFor="studentId">
                        Student
                    </label>

                    <select
                        id="studentId"
                        name="studentId"
                        value={paymentData.studentId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">
                        Select a student
                        </option>

                        {initialStudents.map((student) => (
                        <option
                            key={student.id}
                            value={student.id}
                        >
                            {student.firstName} {student.lastName}
                        </option>
                        ))}
                    </select>
            </div>

          <div className="payment-form__group">
            <label htmlFor="amount">
              Amount
            </label>

            <input
              id="amount"
              name="amount"
              type="number"
              min="0"
              value={paymentData.amount}
              onChange={handleChange}
              required
            />
          </div>

          <div className="payment-form__group">
            <label htmlFor="paymentMethod">
              Payment Method
            </label>

            <select
              id="paymentMethod"
              name="paymentMethod"
              value={paymentData.paymentMethod}
              onChange={handleChange}
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">
                Bank Transfer
              </option>
              <option value="Card">Card</option>
            </select>
          </div>

          <div className="payment-form__group">
            <label htmlFor="description">
              Description
            </label>

            <input
              id="description"
              name="description"
              type="text"
              value={paymentData.description}
              onChange={handleChange}
            />
          </div>

          <button type="submit">
            Record Payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;