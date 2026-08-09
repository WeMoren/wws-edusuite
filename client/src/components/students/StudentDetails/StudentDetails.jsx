import React from "react";
import "./StudentDetails.css";

const StudentDetails = ({ student, onClose, onEdit }) => {
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

        <div className="student-details__actions">
            <button onClick={() => onEdit(student)}>
                Edit Student
            </button>
        </div>        
      </div>
    </div>
  );
};

export default StudentDetails;