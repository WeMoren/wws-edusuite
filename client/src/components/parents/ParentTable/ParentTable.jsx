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
                        <td>{parent.id}</td>   
                        <td>{parent.firstName} {parent.lastName}</td>
                        <td>{parent.phone}</td>
                        <td>{parent.email}</td>
                        <td>{parent.address}</td>
                        <td>{parent.children.join(", ")}</td>
                        <td>
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
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  )
}

export default ParentTable