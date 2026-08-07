import React from 'react'
import StudentTable from '../../components/students/StudentTable'
import "./Students.css"
const Students = () => {
  return (
    <div className='student-page'>
        <div className="students-page__header">
             <h1>Students</h1>

             <button className="students-page__button">
                + Add Student
             </button>
        </div>

        <StudentTable/>
    </div>
  )
}

export default Students