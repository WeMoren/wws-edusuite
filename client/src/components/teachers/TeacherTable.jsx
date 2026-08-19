import React from "react";
import "./TeacherTable.css";

const TeacherTable = ({ teachers, onEdit, onDelete}) => {
  return (
    <div className="teacher-table">
      <table>
        <thead>
          <tr>
            <th>Staff ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Subject</th>
            <th>Gender</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {teachers.map((teacher) => (
            <tr key={teacher.id}>
  <td data-label="Staff ID">{teacher.staffId}</td>

  <td data-label="First Name">
    {teacher.firstName}
  </td>

  <td data-label="Last Name">
    {teacher.lastName}
  </td>

  <td data-label="Subject">
    {teacher.subject}
  </td>

  <td data-label="Gender">
    {teacher.gender}
  </td>

  <td data-label="Actions">
    <div className="teacher-table__actions">
      <button
        className="teacher-table__edit"
        onClick={() => onEdit(teacher)}
      >
        Edit
      </button>

      <button
        className="teacher-table__delete"
        onClick={() => onDelete(teacher.id)}
      >
        Delete
      </button>
    </div>
  </td>
</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeacherTable;