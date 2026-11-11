import React,  {useState}  from 'react';
import { useOutletContext } from "react-router-dom";
import TeacherTable from '../../components/teachers/TeacherTable';
import "./Teachers.css";
import TeacherModal from '../../components/teachers/TeacherModal/TeacherModal';
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import { useAuth } from "../../auth/AuthContext";
import { hasPermission } from "../../auth/permissions";
const API_BASE_URL = "http://localhost:5000/api";

const Teachers = () => {

    const { currentUser, authToken } = useAuth();

    const canCreateTeacher = hasPermission(
        currentUser?.role,
        "teachers",
        "create"
    );

    const canEditTeacher = hasPermission(
        currentUser?.role,
        "teachers",
        "edit"
    );

    const canDeleteTeacher = hasPermission(
        currentUser?.role,
        "teachers",
        "delete"
    );


    const [teacherToDelete, setTeacherToDelete] = useState(null);
    const [ showModal, setShowModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("");
    const [genderFilter, setGenderFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isDeletingTeacher, setIsDeletingTeacher] = useState(false);
const [deleteTeacherError, setDeleteTeacherError] = useState("");
    const teachersPerPage = 5;


    const { 
            teachers, 
            setTeachers,
             refreshRecentActivities,
        } = useOutletContext();


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



const handleEditTeacher = async (teacher) => {
    if (!canEditTeacher) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/teachers/${teacher.id}`,
            {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to fetch teacher details."
            );
        }

        const fetchedTeacher = data.teacher;

        setEditingTeacher({
            id: fetchedTeacher.id,
            staffId: fetchedTeacher.staff_id || "",
            firstName: fetchedTeacher.first_name || "",
            lastName: fetchedTeacher.last_name || "",
            email: fetchedTeacher.email || "",
            phoneNum: fetchedTeacher.phone || "",
            subject: fetchedTeacher.subject || "",
            gender: fetchedTeacher.gender || "",
            status: fetchedTeacher.status || "",
        });

        setShowModal(true);
    } catch (error) {
        console.error("Failed to load teacher details:", error);
    }
};


  return (
    <div className='teachers-page'>
        <div className="teachers-page_header">
            <h1 className='teachers-header'>Teachers</h1>

         {canCreateTeacher && (
            <button
                className="teachers-page__button"
                onClick={() => setShowModal(true)}
            >
                + Add Teacher
            </button>
             )}
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
             canEdit={canEditTeacher}
             canDelete={canDeleteTeacher}
            onEdit={handleEditTeacher}

            onDelete={(teacherId) => {
                 if (!canDeleteTeacher) {
                    return;
                }


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
            loading={isDeletingTeacher}
            error={deleteTeacherError}
            onCancel={() => {
                setTeacherToDelete(null);
                setDeleteTeacherError("");
            }}
            onConfirm={async () => {
                if (!canDeleteTeacher || isDeletingTeacher) {
                    return;
                }

                setIsDeletingTeacher(true);
                setDeleteTeacherError("");

                try {
                    const response = await fetch(
                        `${API_BASE_URL}/teachers/${teacherToDelete.id}`,
                        {
                            method: "DELETE",
                            headers: {
                                Authorization: `Bearer ${authToken}`,
                            },
                        }
                    );

                    const data = await response.json().catch(() => ({}));

                    if (!response.ok) {
                        throw new Error(
                            data.message || "Failed to delete teacher."
                        );
                    }

                    setTeachers((prevTeachers) =>
                        prevTeachers.filter(
                            (teacher) => teacher.id !== teacherToDelete.id
                        )
                    );

                    await refreshRecentActivities();

                    setTeacherToDelete(null);
                } catch (error) {
                    console.error("Failed to delete teacher:", error);
                    setDeleteTeacherError(
                        error.message || "Failed to delete teacher."
                    );
                } finally {
                    setIsDeletingTeacher(false);
                }
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

                onAddTeacher={async (teacherData) => {
                    try {
                        const isEditing = Boolean(editingTeacher);

                        const response = await fetch(
                            isEditing
                                ? `${API_BASE_URL}/teachers/${editingTeacher.id}`
                                : `${API_BASE_URL}/teachers`,
                            {
                                method: isEditing ? "PATCH" : "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${authToken}`,
                                },
                                body: JSON.stringify(teacherData),
                            }
                        );

                        const data = await response.json().catch(() => ({}));

                        if (!response.ok) {
                            throw new Error(
                                data.message || "Failed to save teacher."
                            );
                        }

                        const savedTeacher = data.teacher;

                        const updatedTeacher = {
                            id: savedTeacher.id,
                            staffId: savedTeacher.staff_id,
                            firstName: savedTeacher.first_name,
                            lastName: savedTeacher.last_name,
                            email: savedTeacher.email || "",
                            phoneNum: savedTeacher.phone || "",
                            subject: savedTeacher.subject,
                            gender: savedTeacher.gender || "",
                            status: savedTeacher.status,
                        };

                        if (isEditing) {
                            setTeachers((prevTeachers) =>
                                prevTeachers.map((teacher) =>
                                    teacher.id === updatedTeacher.id
                                        ? updatedTeacher
                                        : teacher
                                )
                            );

                            setEditingTeacher(null);
                        } else {
                            setTeachers((prevTeachers) => [
                                ...prevTeachers,
                                updatedTeacher,
                            ]);

                           
                        }

                     await refreshRecentActivities();

                        setShowModal(false);
                    } catch (error) {
                        console.error("Failed to save teacher:", error);
                           throw error;
                    }
                }}
             />
        )}
    </div>
  )
}

export default Teachers