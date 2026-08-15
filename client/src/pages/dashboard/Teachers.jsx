import React,  {useEffect, useState}  from 'react';
import { useOutletContext } from "react-router-dom";
import initialTeachers from '../../data/teachers';
import TeacherTable from '../../components/teachers/TeacherTable';
import "./Teachers.css";
import TeacherModal from '../../components/teachers/TeacherModal/TeacherModal';
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";


const Teachers = () => {
    const [teacherToDelete, setTeacherToDelete] = useState(null);
    const [ showModal, setShowModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("");
    const [genderFilter, setGenderFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const teachersPerPage = 5;


    const { teachers, setTeachers } = useOutletContext();


const filteredTeachers = teachers.filter((teacher) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch = 
    teacher.staffId.toLowerCase().includes(search) ||
    teacher.firstName.toLowerCase().includes(search) ||
    teacher.lastName.toLowerCase().includes(search) ||
    teacher.subject.toLowerCase().includes(search);

    const matchesSubject = 
        subjectFilter === "" || 
        teacher.subject === subjectFilter;

    const matchesGender = 
        genderFilter === "" || 
        teacher.gender === genderFilter;


    return (
        matchesSearch && matchesSubject && matchesGender
    )
});

    const totalPages = Math.ceil(
        filteredTeachers.length / teachersPerPage
        );

        const startIndex = (currentPage - 1) * teachersPerPage;

        const currentTeachers = filteredTeachers.slice(
        startIndex,
        startIndex + teachersPerPage
);

    useEffect(() => {
        localStorage.setItem("teachers", JSON.stringify(teachers))
    }, [teachers]
)


  return (
    <div className='teachers-page'>
        <div className="teachers-page_header">
            <h1>Teachers</h1>

            <button
             className="teachers-page__button"
             onClick={() => setShowModal(true)}
             >
                + Add Teacher
            </button>
        </div>

        <div className="teachers-page__filters">
            <input
                type="text"
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
            >
                <option value="">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
                <option value="Physics">Physics</option>
                <option value="Biology">Biology</option>
                <option value="Chemistry">Chemistry</option>
            </select>

            <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
            >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
            </select>
        </div>


        <TeacherTable 
            teachers={currentTeachers}

            onEdit={(teacher) => {
                setEditingTeacher(teacher);
                setShowModal(true)
            }}

            onDelete={(teacherId) => {
                const teacher = teachers.find(
              (teacher) => teacher.id === teacherId
        );

  setTeacherToDelete(teacher);
}}

        />

          {totalPages  > 1 && (
            <div className="teachers-page__pagination">
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

          {teacherToDelete && (
                 <ConfirmDialog
                    title="Delete Teacher"
                    message={`Are you sure you want to delete ${teacherToDelete.firstName} ${teacherToDelete.lastName}?`}
                    onCancel={() => setTeacherToDelete(null)}
                    onConfirm={() => {
                    setTeachers((prevTeachers) =>
                        prevTeachers.filter(
                        (teacher) => teacher.id !== teacherToDelete.id
                )
      );

      setTeacherToDelete(null);
    }}
  />
)}


        {showModal && (
             <TeacherModal
                onClose={() =>  {
                    setShowModal(false);
                    setEditingTeacher(null)
                }}

                editingTeacher={editingTeacher}

                onAddTeacher={(teacherData) => {
                    if(editingTeacher) {
                        setTeachers((prevTeachers) => 
                            prevTeachers.map((teacher) => 
                                teacher.id === editingTeacher.id
                                ? {...teacherData, id: editingTeacher.id}
                                : teacher
                            )
                        )

                        setEditingTeacher(null);
                        setShowModal(false)
                    } else { 
                     setTeachers((prevTeachers) =>[
                    ...prevTeachers,
                    {
                        ...teacherData,
                        id:prevTeachers.length > 0 
                        ? Math.max(
                            ...prevTeachers.map((teacher) => teacher.id)
                        ) + 1 : 1
                    }
                        
                   ])
                    setShowModal(false)
                    }
                }}
             />
        )}
    </div>
  )
}

export default Teachers