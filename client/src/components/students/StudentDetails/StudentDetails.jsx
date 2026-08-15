import React, { useState } from "react";
import classFees from "../../../data/classFees";
import "./StudentDetails.css";
import PaymentReceipt from "../../accountant/PaymentReceipt/PaymentReceipt";
import { Receipt } from "lucide-react";
const StudentDetails = ({ student, payments, onClose, onEdit }) => {

  const [selectedPayment, setSelectedPayment] = useState(null);

    const studentPayments = payments.filter(
        (payment) => payment.studentId === student.id
     );
    const totalFees = classFees[student.class] || 0;

    const totalPaid = studentPayments.reduce(
        (total, payment) => total + payment.amount, 0);

    const outstandingFees = Math.max( totalFees - totalPaid, 0);

  return (
    <div className="student-details__overlay">
      <div className="student-details">
        <div className="student-details__header">
          <h2>Student Details</h2>

          <button onClick={onClose}>
            ×
          </button>
        </div>

        <div className="student-details__info">
          <p>
            <strong>Admission Number:</strong>
            {student.admissionNo}
          </p>

          <p>
            <strong>First Name:</strong>
            {student.firstName}
          </p>

          <p>
            <strong>Last Name:</strong>
            {student.lastName}
          </p>

          <p>
            <strong>Class:</strong>
            {student.class}
          </p>

          <p>
            <strong>Gender:</strong>
            {student.gender}
          </p>
        </div>



        <section className="student-details__financial">
              <h3>Financial Summary</h3>

              <div className="student-details__financial-grid">
                <div className="student-details__financial-card">
                  <span>Total Fees</span>
                  <strong>
                    ₦{totalFees.toLocaleString()}
                  </strong>
                </div>

                <div className="student-details__financial-card">
                  <span>Total Paid</span>
                  <strong>
                    ₦{totalPaid.toLocaleString()}
                  </strong>
                </div>

                <div className="student-details__financial-card">
                  <span>Outstanding</span>
                  <strong>
                    ₦{outstandingFees.toLocaleString()}
                  </strong>
                </div>
               </div>
            </section>


          <section className="student-details__history">
            <h3>Payment History</h3>

          {studentPayments.length > 0 ? (
            <div className="student-details__payments">
              {studentPayments.map((payment) => (
                <div
                  className="student-details__payment"
                  key={payment.id}
                >
                  <div>
                    <strong>
                      ₦{payment.amount.toLocaleString()}
                    </strong>

                    <span>
                      {new Date(payment.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute:"2-digit",
                        hour12:true
                      })}
                    </span>
                  </div>

                  <div>
                    <span>{payment.paymentMethod}</span>
                    <span>{payment.description || "—"}</span>
                  </div>

                  <button
                    type="button"
                    className="student-details__receipt-button"
                    onClick={() => setSelectedPayment(payment)}
                  >
                      <Receipt size={16} strokeWidth={2} />
                      <span>Receipt</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="student-details__no-payments">
              No payments recorded for this student.
            </p>
          )}
        </section>       

        <div className="student-details__actions">
            <button onClick={() => onEdit(student)}>
                Edit Student
            </button>
        </div> 
      </div>

      {selectedPayment && (
        <PaymentReceipt
            payment={selectedPayment}
            student={student}
            onClose={() => setSelectedPayment(null)}
        />
)}


    </div>
  );
};

export default StudentDetails;