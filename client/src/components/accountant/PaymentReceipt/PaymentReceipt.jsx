import React from "react";
import school from "../../../data/school";
import "./PaymentReceipt.css";

const PaymentReceipt = ({ payment, student, onClose }) => {
  const receiptNumber = `REC-${String(payment.id).padStart(5, "0")}`;

  return (
    <div className="payment-receipt">
      <div className="payment-receipt__content">

        <div className="payment-receipt__header">
          <h2>{school.name}</h2>
          <p>Payment Receipt</p>
        </div>

        <div className="payment-receipt__school-info">
          <p>{school.address}</p>
          <p>{school.phone}</p>
          <p>{school.email}</p>
        </div>

        <div className="payment-receipt__details">
          <p>
            <strong>Receipt No:</strong> {receiptNumber}
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {new Date(payment.date).toLocaleDateString("en-GB")}
          </p>

          <p>
            <strong>Student:</strong>{" "}
            {student.firstName} {student.lastName}
          </p>

          <p>
            <strong>Admission No:</strong> {student.admissionNo}
          </p>

          <p>
            <strong>Class:</strong> {student.class}
          </p>

          <p className="payment-receipt__amount">
            <strong>Amount Paid:</strong>{" "}
            ₦{payment.amount.toLocaleString()}
          </p>

          <p>
            <strong>Payment Method:</strong> {payment.paymentMethod}
          </p>

          <p>
            <strong>Description:</strong>{" "}
            {payment.description || "—"}
          </p>
        </div>

        <div className="payment-receipt__actions">

            <button
                type="button"
                onClick={() => window.print()}
            >
                Print Receipt
            </button>



          <button
             type="button" 
             onClick={onClose}
             
            >
             Close
          </button>
        </div>

        <div className="payment-receipt__footer">
            <p>Thank you for your payment.</p>
            <small>Powered by WeMoren Web Services</small>
        </div>    

      </div>
    </div>
  );
};

export default PaymentReceipt;