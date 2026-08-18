import React, {useEffect, useState} from 'react'
import {useOutletContext} from "react-router-dom";
import StudentTable from '../../components/students/StudentTable'
import "./Students.css"
import StudentModal from '../../components/students/StudentModal/StudentModal'
import initialStudents from "../../data/students";
import academicLevels from "../../data/academicLevels";
import StudentDetails from '../../components/students/StudentDetails/StudentDetails'
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";



const Students = () => {

    const [studentToDelete, setStudentToDelete] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [classFilter, setClassFilter] = useState("");
    const [genderFilter, setGenderFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const studentsPerPage = 5;
    const [selectedStudent, setSelectedStudent] = useState(null)
    



   const { 
            students, 
            setStudents, 
            payments, 
            enrollments, 
            setEnrollments
         } = useOutletContext();

    useEffect(() => {
        localStorage.setItem("students", JSON.stringify(students))
    }, [students]);


        useEffect(() => {
    setCurrentPage(1);
    }, [searchTerm, classFilter, genderFilter]);



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
        
    });

    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage)

    const startIndex = (currentPage - 1) * studentsPerPage;

    const currentStudents = filteredStudents.slice(
        startIndex, startIndex + studentsPerPage
    );

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
                placeholder='Search students...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />


                <select 
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                >
                   <option value="">All Levels</option>

                    {academicLevels.map((level) => (
                    <option
                        key={level.id}
                        value={level.name}
                    >
                        {level.name}
                    </option>
                    ))}
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
            students ={currentStudents}
            payments={payments}
            enrollments={enrollments}
            onEdit={(students)  =>  {
                setEditingStudent(students);
                setShowModal(true)
            }}

            onDelete={(studentId) => {
             const student = students.find(
             (student) => student.id === studentId
  );

  setStudentToDelete(student);
}}

        onView={(student)  => {
            setSelectedStudent(student)
        }}
    />

        {selectedStudent && (
            <StudentDetails
                student={selectedStudent}
                onClose={() => setSelectedStudent(null)}
                payments={payments}
                onEdit={(student) => {
                    setSelectedStudent(null)
                    setEditingStudent(student)
                    setShowModal(true)
                }}
            />
        )}

        { totalPages > 1 && (
            <div className="students-page__pagination">
                <button
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    disabled={currentPage === 1} 
                >
                    Previous
                </button>

                <span>
                    Page {currentPage} of {totalPages}  
                </span>

                <button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
            </div>
        )}


            {studentToDelete && (
                <ConfirmDialog
                    title="Delete Student"
                    message={`Are you sure you want to delete ${studentToDelete.firstName} ${studentToDelete.lastName}?`}
                    onCancel={() => setStudentToDelete(null)}
                    onConfirm={() => {
                    setStudents((prevStudents) =>
                        prevStudents.filter(
                        (student) => student.id !== studentToDelete.id
                        )
                    );

      setStudentToDelete(null);
    }}
  />
)}



        {showModal && (
            <StudentModal
                onClose={() => setShowModal(false) }
                studentToEdit={editingStudent} 
                onAddStudent={(studentData, enrollmentData, studentToEdit) => {
                    if (studentToEdit) {
                        // Update existing student
                        setStudents((prevStudents) =>
                            prevStudents.map((student) =>
                                student.id === studentToEdit.id
                                    ? {
                                        ...studentData,
                                        id: student.id,
                                    }
                                    : student
                            )
                        );

                        // Update the student's enrollment
                        setEnrollments((prevEnrollments) =>
                            prevEnrollments.map((enrollment) =>
                                enrollment.studentId === studentToEdit.id
                                    ? {
                                        ...enrollment,
                                        academicSessionId: Number(
                                            enrollmentData.academicSessionId
                                        ),
                                        academicLevelId: Number(
                                            enrollmentData.sectionId
                                        ),

                                        classId:enrollmentData.classId
                                        ? Number(enrollment.classId) : null,

                                        sectionId:enrollmentData.sectionId
                                        ? Number(enrollmentData.sectionId) : null,
                                    }
                                    : enrollment
                            )
                        );
                    } else {
                        // Create a new student ID
                        const newStudentId =
                            students.length > 0
                                ? Math.max(
                                    ...students.map((student) => student.id)
                                ) + 1
                                : 1;

                        // Save the student
                        setStudents((prevStudents) => [
                            ...prevStudents,
                            {
                                ...studentData,
                                id: newStudentId,
                            },
                        ]);

                        // Create the enrollment
                        setEnrollments((prevEnrollments) => [
                            ...prevEnrollments,
                            

                            {
                                id:
                                    prevEnrollments.length > 0
                                        ? Math.max(
                                            ...prevEnrollments.map(
                                                (enrollment) => enrollment.id
                                            )
                                        ) + 1
                                        : 1,

                                studentId: newStudentId,

                                academicSessionId: Number(
                                    enrollmentData.academicSessionId
                                ),

                                academicLevelId: Number(
                                    enrollmentData.academicLevelId
                                ),

                                classId: enrollmentData.classId
                                    ? Number(enrollmentData.classId)
                                    : null,

                                sectionId: enrollmentData.sectionId
                                    ? Number(enrollmentData.sectionId)
                                    : null,
                            }
                        ]);
                    }

                    setShowModal(false);
                    setEditingStudent(null);
                }}
        />)}

    </div>
  )
}

export default Students