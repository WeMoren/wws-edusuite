import React, {useEffect, useState} from 'react'
import {useOutletContext} from "react-router-dom";
import StudentTable from '../../components/students/StudentTable'
import "./Students.css"
import StudentModal from '../../components/students/StudentModal/StudentModal'
import StudentDetails from '../../components/students/StudentDetails/StudentDetails'
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import { useAuth } from "../../auth/AuthContext";
import { hasPermission } from "../../auth/permissions";
import NotificationDialog from "../../components/common/NotificationDialog/NotificationDialog";
const API_BASE_URL = "http://localhost:5000/api";

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
    const [notification, setNotification] = useState(null);




   const {
            students,
            setStudents,
            payments,
            financialAccounts,
            setFinancialAccounts,
            financialAccountsLoading,
            financialAccountsError,
            enrollments,
            setEnrollments,
            academicLevels,
            academicSessions,
            academicTerms,
            sections,
            classes,
             streams,
            streamLevels,
            subjectCombinations,
            refreshRecentActivities,
         } = useOutletContext();


         const currentAcademicSession = academicSessions.find(
                (session) => session.isCurrent
                );

                const currentAcademicTerm = academicTerms.find(
                (term) =>
                    term.isCurrent &&
                    term.academicSessionId === currentAcademicSession?.id
            );


        useEffect(() => {
    setCurrentPage(1);
    }, [searchTerm, classFilter, genderFilter]);


const { currentUser, authToken } = useAuth();

    const canCreateStudent = hasPermission(
    currentUser?.role,
    "students",
    "create"
    );

    const canEditStudent = hasPermission(
    currentUser?.role,
    "students",
    "edit"
    );

    const canDeleteStudent = hasPermission(
    currentUser?.role,
    "students",
    "delete"
    );

        const userRoles = Array.isArray(currentUser?.roles)
        ? currentUser.roles
        : [currentUser?.role];

    const canViewFinancialAccounts = userRoles.some((role) =>
        hasPermission(role, "accountant", "view")
    );

    const canViewStudentPaymentStatus = userRoles.some((role) =>
        hasPermission(role, "students", "view")
    );



    const filteredStudents = students.filter((student) => {
        const search = searchTerm.trim().toLowerCase();

        const enrollment = enrollments.find(
            (item) => item.studentId === student.id
        );

        const section = sections.find(
            (item) => item.id === enrollment?.sectionId
        );

        const classItem = classes.find(
            (item) =>
                item.id === (section?.classId ?? enrollment?.classId)
        );

        const academicLevel = academicLevels.find(
            (item) =>
                item.id === (
                    classItem?.academicLevelId ??
                    enrollment?.academicLevelId
                )
        );

        const matchesSearch =
            (student.admissionNo ?? "").toLowerCase().includes(search) ||
            (student.firstName ?? "").toLowerCase().includes(search) ||
            (student.middleName ?? "").toLowerCase().includes(search) ||
            (student.lastName ?? "").toLowerCase().includes(search) ||
            (classItem?.name ?? "").toLowerCase().includes(search) ||
            (academicLevel?.name ?? "").toLowerCase().includes(search);

        const matchesClass =
            classFilter === "" ||
            academicLevel?.name === classFilter;

        const matchesGender =
            genderFilter === "" || student.gender === genderFilter;

        return matchesSearch && matchesClass && matchesGender;
    });



    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage)

    const startIndex = (currentPage - 1) * studentsPerPage;

    const currentStudents = filteredStudents.slice(
        startIndex, startIndex + studentsPerPage
    );

  return (
    <div className='student-page'>
        <div className="students-page__header">
             <h1 className='students-header'>Students</h1>

        {canCreateStudent && (
            <button
                className="students-page__button"
                onClick={() => {
                    setEditingStudent(null);
                    setShowModal(true);
                }}
            >
                + Add Student
            </button>
            )}
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
            financialAccounts={financialAccounts}
            financialAccountsLoading={financialAccountsLoading}
            currentAcademicSessionId={currentAcademicSession?.id}
            currentAcademicTermId={currentAcademicTerm?.id}
            academicLevels={academicLevels}
            sections={sections}
            classes={classes}
            canEdit={canEditStudent}
            canViewFinancialAccounts={canViewFinancialAccounts}
            canDelete={canDeleteStudent}
            onEdit={(students)  =>  {
                if(!canEditStudent){
                    return;
                }
                setEditingStudent(students);
                setShowModal(true)
            }}

            onDelete={(studentId) => {

                if(!canDeleteStudent){
                    return;
                }
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
                 financialAccounts={financialAccounts}
                financialAccountsLoading={financialAccountsLoading}
                financialAccountsError={financialAccountsError}
                canEdit={canEditStudent}
                canViewFinancialAccounts={canViewFinancialAccounts}
                onEdit={(student) => {
                    if(!canEditStudent){
                        return;
                    }
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
                    onConfirm={async () => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/students/${studentToDelete.id}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to delete student.");
        }

        setStudents((previousStudents) =>
            previousStudents.filter(
                (student) => student.id !== studentToDelete.id
            )
        );

        setEnrollments((previousEnrollments) =>
            previousEnrollments.filter(
                (enrollment) => enrollment.studentId !== studentToDelete.id
            )
        );

        setStudentToDelete(null);
    } catch (error) {
    setNotification({
        title: "Unable to delete student",
        message: error.message || "Something went wrong. Please try again.",
    });
}
}}
  />
)}



        {showModal && (
            <StudentModal
                onClose={() => {
                        setShowModal(false);
                        setEditingStudent(null);
                    }}
                studentToEdit={editingStudent}
                academicSessions={academicSessions}
                academicLevels={academicLevels}
                sections={sections}
                classes={classes}
                enrollments={enrollments}
                 streams={streams}
                streamLevels={streamLevels}
                subjectCombinations={subjectCombinations}

    onAddStudent={async (studentData, enrollmentData, studentToEdit) => {
    const request = async (url, options = {}) => {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "The request failed.");
        }

        return data;
    };


       const refreshStudentsAndEnrollments = async () => {
    const accountEndpoint = canViewFinancialAccounts
        ? "/student-financial-accounts"
        : canViewStudentPaymentStatus
            ? "/student-financial-accounts/payment-statuses"
            : null;

    const [studentsData, enrollmentsData, accountsData] =
        await Promise.all([
            request("/students"),
            request("/enrollments"),
            accountEndpoint
                ? request(accountEndpoint)
                : Promise.resolve({}),
        ]);

    setStudents(
        (studentsData.students || []).map((student) => ({
            id: student.id,
            schoolId: student.school_id,
            admissionNo: student.admission_no,
            firstName: student.first_name,
            middleName: student.middle_name,
            lastName: student.last_name,
            gender: student.gender,
            dateOfBirth: student.date_of_birth,
            phone: student.phone,
            email: student.email,
            address: student.address,
            status: student.status,
            createdAt: student.created_at,
            updatedAt: student.updated_at,
        }))
    );

    setEnrollments(
        (enrollmentsData.enrollments || []).map((enrollment) => ({
            id: enrollment.id,
            schoolId: enrollment.school_id,
            studentId: enrollment.student_id,
            academicSessionId: enrollment.academic_session_id,
            academicLevelId: enrollment.academic_level_id,
            classId: enrollment.class_id,
            sectionId: enrollment.section_id,
            streamId: enrollment.stream_id,
            combinationId: enrollment.subject_combination_id,
            subjectCombinationId: enrollment.subject_combination_id,
            status: enrollment.status,
            enrolledAt: enrollment.enrolled_at,
            admissionNo: enrollment.admission_no,
            firstName: enrollment.first_name,
            middleName: enrollment.middle_name,
            lastName: enrollment.last_name,
            academicSessionName: enrollment.academic_session_name,
            className: enrollment.class_name,
            sectionName: enrollment.section_name,
            streamName: enrollment.stream_name,
            combinationName: enrollment.subject_combination_name,
        }))
    );

    let mappedAccounts = [];

    if (canViewFinancialAccounts) {
        mappedAccounts = (accountsData.financialAccounts || []).map(
            (account) => ({
                id: account.id,
                studentId: account.student_id,
                enrollmentId: account.enrollment_id,
                academicSessionId: account.academic_session_id,
                academicSessionName: account.academic_session_name,
                termId: account.term_id,
                termName: account.term_name,
                feeStructureId: account.fee_structure_id,
                feeStructureName: account.fee_structure_name,
                className: account.class_name,
                academicLevelName: account.academic_level_name,
                totalDue: Number(account.total_due),
                totalPaid: Number(account.total_paid),
                status: account.status,
                outstanding: Math.max(
                    Number(account.total_due) - Number(account.total_paid),
                    0
                ),
            })
        );
    } else if (canViewStudentPaymentStatus) {
        mappedAccounts = (accountsData.paymentStatuses || []).map(
            (account) => ({
                studentId: account.student_id,
                enrollmentId: account.enrollment_id,
                termId: account.term_id,
                status: account.status,
            })
        );
    }

    setFinancialAccounts(mappedAccounts);
};

    const enrollmentPayload = {
        academicSessionId: enrollmentData.academicSessionId,
        classId: enrollmentData.classId,
        sectionId: enrollmentData.sectionId,
        streamId: enrollmentData.streamId || null,
        subjectCombinationId: enrollmentData.combinationId || null,
    };

    if (studentToEdit) {
        const existingEnrollment = enrollments.find(
            (enrollment) => enrollment.studentId === studentToEdit.id
        );

        if (!existingEnrollment) {
            throw new Error(
                "The student's enrollment could not be found. Refresh the page and try again."
            );
        }

        await request(`/students/${studentToEdit.id}`, {
            method: "PATCH",
            body: JSON.stringify(studentData),
        });

        await refreshRecentActivities();

        try {
            await request(`/enrollments/${existingEnrollment.id}`, {
                method: "PATCH",
                body: JSON.stringify(enrollmentPayload),
            });
        } catch (error) {
            await refreshStudentsAndEnrollments();
            throw new Error(
                `Student details were saved, but the enrollment update failed: ${error.message}`
            );
        }

        await refreshStudentsAndEnrollments();

        await refreshRecentActivities();

       
    } else {
        const result = await request("/students", {
            method: "POST",
            body: JSON.stringify(studentData),
        });

        await refreshRecentActivities();

        try {
            await request("/enrollments", {
                method: "POST",
                body: JSON.stringify({
                    studentId: result.student.id,
                    ...enrollmentPayload,
                }),
            });
        } catch (error) {
            await refreshStudentsAndEnrollments();
            throw new Error(
                `The student was created, but enrollment failed: ${error.message}`
            );
        }

        await refreshStudentsAndEnrollments();

        await refreshRecentActivities();

    }

    setShowModal(false);
    setEditingStudent(null);
}}

        />)}

    </div>
  )
}

export default Students