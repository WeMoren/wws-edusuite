import React,  {useEffect, useState}  from 'react'
import initialTeachers from '../../data/teachers'
import TeacherTable from '../../components/teachers/TeacherTable'
import "./Teachers.css"
import TeacherModal from '../../components/teachers/TeacherModal/TeacherModal'



const Teachers = () => {
    const [ showModal, setShowModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [teachers, setTeachers] = useState(() => {
    const savedTeachers = localStorage.getItem("teachers");

  return savedTeachers
    ? JSON.parse(savedTeachers)
    : initialTeachers;
});

    useEffect(() => {
        localStorage.setItem("teachers", JSON.stringify(teachers))
    }, [teachers]
)


  return (
    <div className='teachers-page'>
        <div className="teachers-page_header">
            <h1>Teachers</h1>

            <button
             className="teacher-page__button"
             onClick={() => setShowModal(true)}
             >
                + Adde Teacher
            </button>
        </div>

        <TeacherTable 
            teachers={teachers}

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