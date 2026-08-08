import React, {useEffect, useState} from 'react'
import StudentTable from '../../components/students/StudentTable'
import "./Students.css"
import StudentModal from '../../components/students/StudentModal/StudentModal'
import initialStudents from "../../data/students"

const Students = () => {
    const [showModal, setShowModal] = useState(false)
    const [students, setStudents] = useState(() => {
        const savedStudents = localStorage.getItem("students")
        return savedStudents ? JSON.parse(savedStudents) : initialStudents;
    });

    useEffect(() => {
        localStorage.setItem("students", JSON.stringify(students))
    }, [students])
  return (
    <div className='student-page'>
        <div className="students-page__header">
             <h1>Students</h1>

             <button
                 className="students-page__button"
                onClick={() => setShowModal(true)}
             >
                + Add Student
             </button>
        </div>

        <StudentTable students ={students}/>

        {showModal && (
            <StudentModal
                onClose={() => setShowModal(false) }
                onAddStudent={(newStudent) => {
                    setStudents((prevStudents) =>  [
                        ...prevStudents, {
                            ...newStudent,
                            id:prevStudents.length + 1
                        }
                    ])
                }}
        />)}

    </div>
  )
}

export default Students