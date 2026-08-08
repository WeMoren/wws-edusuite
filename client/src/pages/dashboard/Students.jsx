import React, {useEffect, useState} from 'react'
import StudentTable from '../../components/students/StudentTable'
import "./Students.css"
import StudentModal from '../../components/students/StudentModal/StudentModal'
import initialStudents from "../../data/students"

const Students = () => {
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [classFilter, setClassFilter] = useState("");
    const [genderFilter, setGenderFilter] = useState("");

    const [students, setStudents] = useState(() => {
        const savedStudents = localStorage.getItem("students")
        return savedStudents ? JSON.parse(savedStudents) : initialStudents;
    });

    useEffect(() => {
        localStorage.setItem("students", JSON.stringify(students))
    }, [students])

    const filteredStudents = students.filter((student) => {
        const search = searchTerm.toLowerCase();

        const matchesSearch =
            student.admissionNo.toLowerCase().includes(search)  ||
            student.firstName.toLowerCase().includes(search)  ||
            student.lastName.toLowerCase().includes(search)  ||
            student.class.toLowerCase().includes(search);
            
            
            const matchesClass = 
                classFilter === "" || student.class === classFilter;

            const matchesGender = 
                genderFilter === "" || student.gender === genderFilter;
                
          return matchesSearch && matchesClass && matchesGender      
        
    })
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

        <div className="students-page__search">
            <input 
                type="text"
                placeholder='Search students'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />


                <select 
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                >
                    <option value="">All Classes</option>
                    <option value="JSS 1">JSS 1</option>
                    <option value="JSS 2">JSS 2</option>
                    <option value="JSS 3">JSS 3</option>
                    <option value="SS 1">JSS 1</option>
                    <option value="SS 2">JSS 2</option>
                    <option value="SS 3">JSS 3</option>
                </select>

                <select
                    value={genderFilter}
                    onChange={(e)  => setGenderFilter(e.target.value)}
                >
                    <option value="">All Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
        </div>

        <StudentTable 
            students ={filteredStudents}
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