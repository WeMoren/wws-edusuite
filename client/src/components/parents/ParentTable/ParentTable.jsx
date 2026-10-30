import React from "react";
import "./ParentTable.css";

const ParentTable = ({
  parents = [],
  onEdit,
  onDelete,
  rowOffset = 0,
}) => {
  if (parents.length === 0) {
    return null;
  }

  return (
    <div className="parent-table__wrapper">
      <table className="parent-table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col">Address</th>
            <th scope="col">Children</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>

        <tbody>
          {parents.map((parent, index) => (
            <tr key={parent.id}>
              <td data-label="#">
                {rowOffset + index + 1}
              </td>

              <td data-label="Name">
                {[parent.firstName, parent.lastName]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </td>

              <td data-label="Email">
                {parent.email || "—"}
              </td>

              <td data-label="Phone">
                {parent.phone || "—"}
              </td>

              <td data-label="Address">
                {parent.address || "—"}
              </td>

              <td data-label="Children">
                {Array.isArray(parent.children) && parent.children.length > 0
                  ? parent.children.join(", ")
                  : "No students linked"}
              </td>

              <td data-label="Actions">
                <div className="parent-table__actions">
                  <button
                    type="button"
                    className="parent-table__edit"
                    onClick={() => onEdit(parent)}
                    aria-label={`Edit ${parent.firstName} ${parent.lastName}`}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="parent-table__delete"
                    onClick={() => onDelete(parent.id)}
                    aria-label={`Delete ${parent.firstName} ${parent.lastName}`}
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

export default ParentTable;
