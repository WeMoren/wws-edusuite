import React, {useEffect, useState} from 'react'
import StudentTable from '../../components/students/StudentTable'
import "./Students.css"
import StudentModal from '../../components/students/StudentModal/StudentModal'
import initialStudents from "../../data/students"

const Students = () => {
    const [showModal, setShowModal] = useState(false)
    const [editingStudent, setEditingStudent] = useState(null)
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

        <StudentTable 
            students ={students}
            onEdit={(students)  =>  {
                setEditingStudent(students);
                setShowModal(true)
            }}

            onDelete={(studentId) => {
                setStudents((prevStudents) =>
                prevStudents.filter(
                (student) => student.id !== studentId
      )
    );
  }}
        />

        {showModal && (
            <StudentModal
                onClose={() => setShowModal(false) }
                studentToEdit={editingStudent} 
                onAddStudent={(studentData, studentToEdit) => {
                    if (studentToEdit) {
                        setStudents((prevStudents) =>
                        prevStudents.map((student) =>
                            student.id === studentToEdit.id
                            ? { ...studentData, id: student.id }
                            : student
                        )
                        );
                    } else {
                        setStudents((prevStudents) => [
                        ...prevStudents,
                        {
                            ...studentData,
                            id: prevStudents.length + 1,
                        },
                        ]);
                    }
                    setShowModal(false);
                    setEditingStudent(null)
                    }}
                    
        />)}

    </div>
  )
}

export default Students