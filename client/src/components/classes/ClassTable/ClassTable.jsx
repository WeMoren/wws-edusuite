import React from "react";
import "./ClassTable.css";

const ClassTable = ({
  classes,
  academicLevels,
  academicSessions,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
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
                <td data-label="ID">{schoolClass.id}</td>

                <td data-label="Class">{schoolClass.name}</td>

                <td data-label="Academic Level">
                  {level?.name || "—"}
                </td>

                <td data-label="Academic Session">
                  {session?.name || "—"}
                </td>

                <td data-label="Actions">
                  {(canEdit || canDelete) && (
                    <div className="class-table__actions">
                      {canEdit && (
                        <button
                          className="class-table__edit"
                          onClick={() => onEdit(schoolClass)}
                        >
                          Edit
                        </button>
                      )}

                      {canDelete && (
                        <button
                          className="class-table__delete"
                          onClick={() => onDelete(schoolClass.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
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