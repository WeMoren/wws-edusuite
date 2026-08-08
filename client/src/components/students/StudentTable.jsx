import React from 'react';
import "./StudentTable.css";


const StudentTable = ({students, onEdit, onDelete}) => {
  return (
    <div className='student-table'>
        <table>
            <thead>
            
                <tr>
                    <th>Admission No.</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Class</th>
                    <th>Gender</th>
                    <th>Actions</th>
                </tr>
            </thead>

            <tbody>
                {students.map((student) => (
                     <tr key={student.id}>
                        <td>{student.admissionNo}</td>
                        <td>{student.firstName}</td>
                        <td>{student.lastName}</td>
                        <td>{student.class}</td>
                        <td>{student.gender}</td>
                        <td>
                            <button onClick={() => onEdit(student)}>
                                 Edit
                            </button>

                            <button onClick={() => {
                                const confirmed = window.confirm(
                                    `Delete ${student.firstName}  ${student.lastName}?`
                                );

                                if(confirmed){
                                    onDelete(student.id)
                                }
                            }}>
                                Delete
                            </button>
                        
                        </td>
                     </tr>
                ) )} 
            </tbody>
        </table>
    </div>
  )
}

export default StudentTable