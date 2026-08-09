import React from 'react';
import "./StudentTable.css";


const StudentTable = ({students, onEdit, onDelete, onView}) => {
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
                {students.length  > 0 ? (
                students.map((student) => (
                     <tr key={student.id}>
                        <td>{student.admissionNo}</td>
                        <td>
                            <button 
                                className="student-table__name"
                                onClick={()  => onView(student)}
                            >
                                {student.firstName}
                            </button>
                        </td>
                        <td>{student.lastName}</td>
                        <td>{student.class}</td>
                        <td>{student.gender}</td>


                        <td>
                            <div className="student-table__actions">
                                <button
                                className='student-table__edit'
                                 onClick={() => onEdit(student)}>
                                 Edit
                            </button>

                            <button 
                            className='student-table__delete'
                            onClick={() => {
                                const confirmed = window.confirm(
                                    `Delete ${student.firstName}  ${student.lastName}?`
                                );

                                if(confirmed){
                                    onDelete(student.id)
                                }
                            }}>
                                Delete
                            </button>
                            </div>                      
                        </td>
                     </tr>
                ))
                ) : (
                    <tr>
                        <td colSpan="6" className="student-table__empty">
                            No students found.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
  )
}

export default StudentTable