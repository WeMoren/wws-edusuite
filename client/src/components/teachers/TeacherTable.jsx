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
          </tr>
        </thead>

        <tbody>
          {teachers.map((teacher) => (
            <tr key={teacher.id}>
              <td>{teacher.staffId}</td>
              <td>{teacher.firstName}</td>
              <td>{teacher.lastName}</td>
              <td>{teacher.subject}</td>
              <td>{teacher.gender}</td>
              <td>
                <div className="teacher-table__actions">
                    <button 
                        className="teacher-table__edit"
                        onClick={()  => onEdit(teacher)}
                        >
                            Edit
                        </button>

                        <button 
                            className="teacher-table__delete"
                            onClick={()  => onDelete(teacher.id)}
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