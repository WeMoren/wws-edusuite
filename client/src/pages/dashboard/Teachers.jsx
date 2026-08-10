import React,  {useEffect, useState}  from 'react'
import initialTeachers from '../../data/teachers'
import TeacherTable from '../../components/teachers/TeacherTable'
import "./Teachers.css"
import TeacherModal from '../../components/teachers/TeacherModal/TeacherModal'



const Teachers = () => {
    const [ showModal, setShowModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("");
    const [genderFilter, setGenderFilter] = useState("");

    const [teachers, setTeachers] = useState(() => {
    const savedTeachers = localStorage.getItem("teachers");
  return savedTeachers
    ? JSON.parse(savedTeachers)
    : initialTeachers;
});


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
})

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
            teachers={filteredTeachers}

            onEdit={(teacher) => {
                setEditingTeacher(teacher);
                setShowModal(true)
            }}

            onDelete={(teacherId)  => {
                setTeachers((prevTeachers) => 
                    prevTeachers.filter((teacher) => teacher.id !== teacherId));
            }}

        />

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
                        ...newTeacher,
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