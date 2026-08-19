import React from 'react'
import "./ParentTable.css"

const ParentTable = ({ parents, onEdit, onDelete }) => {
  return (
    <div className="parent-table__wrapper">
        <table className="parent-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Children</th>
                    <th>Actions</th>
                </tr>
            </thead>


            <tbody>
                {parents.map((parent) => (
                    <tr key={parent.id}>
    <td data-label="ID">
        {parent.id}
    </td>

    <td data-label="Name">
        {parent.firstName} {parent.lastName}
    </td>

    <td data-label="Phone">
        {parent.phone}
    </td>

    <td data-label="Email">
        {parent.email}
    </td>

    <td data-label="Address">
        {parent.address}
    </td>

    <td data-label="Children">
        {parent.children.join(", ")}
    </td>

    <td data-label="Actions">
        <div className="parent-table__actions">
            <button
                className="parent-table__edit"
                onClick={() => onEdit(parent)}
            >
                Edit
            </button>

            <button
                className="parent-table__delete"
                onClick={() => onDelete(parent.id)}
            >
                Delete
            </button>
        </div>
    </td>
</tr>                ))}
            </tbody>
        </table>
    </div>
  )
}

export default ParentTable