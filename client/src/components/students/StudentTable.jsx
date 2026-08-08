import React from 'react';
import "./StudentTable.css";


const StudentTable = ({students}) => {
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
                     </tr>
                ) )} 
            </tbody>
        </table>
    </div>
  )
}

export default StudentTable