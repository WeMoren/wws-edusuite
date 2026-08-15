import React from 'react';
import "./StudentTable.css";

import classFees from "../../data/classFees";

const StudentTable = ({
  students,
  payments,
  onEdit,
  onDelete,
  onView
}) => {

  return (
    <div className='student-table'>
      <table>
        <thead>
          <tr>
            <th>Admission No.</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Class</th>
            <th>Gender</th>
            <th>Payment Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {students.length > 0 ? (
            students.map((student) => {

              const studentPayments = payments.filter(
                (payment) => payment.studentId === student.id
              );

              const totalPaid = studentPayments.reduce(
                (total, payment) => total + payment.amount,
                0
              );

              const totalFees = classFees[student.class] || 0;

              let paymentStatus = "Outstanding";

              if (totalPaid > 0 && totalPaid >= totalFees) {
                paymentStatus = "Paid";
              } else if (totalPaid > 0) {
                paymentStatus = "Partially Paid";
              }

              return (
                <tr key={student.id}>
                  <td>{student.admissionNo}</td>

                  <td>
                    <button
                      className="student-table__name"
                      title="Click to view student detail."
                      onClick={() => onView(student)}
                    >
                      {student.firstName}
                    </button>
                  </td>

                  <td>{student.lastName}</td>

                  <td>{student.class}</td>

                  <td>{student.gender}</td>

                  <td>
                    <span
                      className={`student-table__payment-status student-table__payment-status--${paymentStatus
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {paymentStatus}
                    </span>
                  </td>

                  <td>
                    <div className="student-table__actions">
                      <button
                        className='student-table__edit'
                        onClick={() => onEdit(student)}
                      >
                        Edit
                      </button>

                      <button
                        className="student-table__delete"
                        onClick={() => onDelete(student.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="7" className="student-table__empty">
                No students found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;