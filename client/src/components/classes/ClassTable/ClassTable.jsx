
import React from "react";
import "./ClassTable.css"
const ClassTable = ({ classes, onEdit, onDelete }) => {
  return (
    <table className="class-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Class</th>
          <th>Level</th>
          <th>Class Teacher</th>
          <th>Room</th>
          <th>Capacity</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {classes.map((schoolClass) => (
          <tr key={schoolClass.id}>
            <td>{schoolClass.id}</td>
            <td>{schoolClass.name}</td>
            <td>{schoolClass.level}</td>
            <td>{schoolClass.classTeacher}</td>
            <td>{schoolClass.room}</td>
            <td>{schoolClass.capacity}</td>
            <td>
                <div className="class-table__actions">
                    <button className="class-table__edit"
                            onClick={() => onEdit(schoolClass)}
                    >
                        Edit
                    </button>

                    <button className="class-table__delete"
                            onClick={() => onDelete(schoolClass.id)}
                    >
                        Delete
                    </button>
                </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ClassTable;