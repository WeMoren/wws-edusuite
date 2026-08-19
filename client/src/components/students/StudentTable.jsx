import React from 'react';
import "./StudentTable.css";

import classFees from "../../data/classFees";
import sections from "../../data/sections";
import classes from "../../data/classes";
import academicLevels from "../../data/academicLevels";

const StudentTable = ({
  students,
  payments,
  enrollments,
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
            <th>Academic Level</th>
            <th>Class</th>
            <th>Section</th>
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


               const enrollment = enrollments.find(
                (enrollment) => enrollment.studentId === student.id
              );


              const section = sections.find(
                  (section) => section.id === enrollment?.sectionId
              );

              const classItem = classes.find(
                  (classItem) =>
                      classItem.id ===
                      (section?.classId ?? enrollment?.classId)
              );

              const academicLevel = academicLevels.find(
                  (level) =>
                      level.id ===
                      (
                          classItem?.academicLevelId ??
                          enrollment?.academicLevelId
                      )
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
                  <td data-label="Admission No.">{student.admissionNo}</td>

<td data-label="First Name">
  <button
    className="student-table__name"
    title="Click to view student detail."
    onClick={() => onView(student)}
  >
    {student.firstName}
  </button>
</td>

<td data-label="Last Name">{student.lastName}</td>

<td data-label="Academic Level">{academicLevel?.name || "-"}</td>

<td data-label="Class">{classItem?.name || "-"}</td>

<td data-label="Section">{section?.name || "-"}</td>

<td data-label="Gender">{student.gender}</td>

<td data-label="Payment Status">
  <span
    className={`student-table__payment-status student-table__payment-status--${paymentStatus
      .toLowerCase()
      .replace(/\s+/g, "-")}`}
  >
    {paymentStatus}
  </span>
</td>

<td data-label="Actions">
  <div className="student-table__actions">
    <button
      className="student-table__edit"
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
              <td colSpan="9" className="student-table__empty">
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