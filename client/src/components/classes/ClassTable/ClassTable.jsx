import React from "react";
import "./ClassTable.css";

const ClassTable = ({
  classes,
  academicLevels,
  academicSessions,
  onEdit,
  onDelete,
}) => {
  return (
    <table className="class-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Class</th>
          <th>Academic Level</th>
          <th>Academic Session</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {classes.length > 0 ? (
          classes.map((schoolClass) => {
            const level = academicLevels.find(
              (academicLevel) =>
                academicLevel.id === schoolClass.academicLevelId
            );

            const session = academicSessions.find(
              (academicSession) =>
                academicSession.id === schoolClass.academicSessionId
            );

            return (
              <tr key={schoolClass.id}>
                <td>{schoolClass.id}</td>

                <td>{schoolClass.name}</td>

                <td>{level?.name || "—"}</td>

                <td>{session?.name || "—"}</td>

                <td>
                  <div className="class-table__actions">
                    <button
                      className="class-table__edit"
                      onClick={() => onEdit(schoolClass)}
                    >
                      Edit
                    </button>

                    <button
                      className="class-table__delete"
                      onClick={() => onDelete(schoolClass.id)}
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
            <td colSpan="5" className="class-table__empty">
              No classes found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default ClassTable;