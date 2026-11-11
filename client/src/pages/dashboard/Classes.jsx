
import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import ClassTable from "../../components/classes/ClassTable/ClassTable";
import ClassModal from "../../components/classes/ClassModal/ClassModal";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import NotificationDialog from "../../components/common/NotificationDialog/NotificationDialog";
import { useAuth } from "../../auth/AuthContext";
import { hasPermission } from "../../auth/permissions";
import "./Classes.css";

const Classes = () => {
    const { currentUser, authToken } = useAuth();

    const API_BASE_URL = "http://localhost:5000/api";

    const apiRequest = async (path, options = {}) => {
        if (!authToken) {
            throw new Error("Your session has expired. Please log in again.");
        }

        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
                ...options.headers,
            },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.message || "The request could not be completed."
            );
        }

        return data;
    };

    const canCreateClass = hasPermission(
        currentUser?.role,
        "classes",
        "create"
    );

    const canEditClass = hasPermission(
        currentUser?.role,
        "classes",
        "edit"
    );

    const canDeleteClass = hasPermission(
        currentUser?.role,
        "classes",
        "delete"
    );

    const {
        classes,
        setClasses,
        activeAcademicLevels,
        academicLevels,
        academicSessions,
    } = useOutletContext();

    const [classToDelete, setClassToDelete] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingClass, setEditingClass] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [levelFilter, setLevelFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [showNotification, setShowNotification] = useState(false);
    const [notification, setNotification] = useState({
        title: "",
        message: "",
    });

    const classesPerPage = 5;

    const notify = ({ title, message }) => {
        setNotification({ title, message });
        setShowNotification(true);
    };

    // Support both current UUID values and older numeric display orders.
    const availableLevels = academicLevels.filter(
        (level) =>
            (activeAcademicLevels || []).includes(level.id) ||
            (activeAcademicLevels || []).includes(level.displayOrder)
    );

    // Reset pagination when filters change.
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, levelFilter]);

    // Filter classes using backend-backed academic data.
    const filteredClasses = classes.filter((schoolClass) => {
        const search = searchTerm.toLowerCase();

        const level = academicLevels.find(
            (academicLevel) =>
                academicLevel.id === schoolClass.academicLevelId
        );

        const session = academicSessions.find(
            (academicSession) =>
                academicSession.id === schoolClass.academicSessionId
        );

        const matchesSearch =
            (schoolClass.name || "").toLowerCase().includes(search) ||
            (level?.name || "").toLowerCase().includes(search) ||
            (session?.name || "").toLowerCase().includes(search);

        const matchesLevel =
            levelFilter === "" ||
            schoolClass.academicLevelId === levelFilter;

        return matchesSearch && matchesLevel;
    });

    const totalPages = Math.ceil(
        filteredClasses.length / classesPerPage
    );

    const startIndex = (currentPage - 1) * classesPerPage;

    const currentClasses = filteredClasses.slice(
        startIndex,
        startIndex + classesPerPage
    );

    // Keep the current page valid when records are removed.
    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const handleSaveClass = async (classData) => {
        const isEditing = Boolean(editingClass);

        try {
            const data = await apiRequest(
                isEditing
                    ? `/classes/${editingClass.id}`
                    : "/classes",
                {
                    method: isEditing ? "PATCH" : "POST",
                    body: JSON.stringify(classData),
                }
            );

            const savedClass = data.class;

            if (!savedClass?.id) {
                throw new Error(
                    "The server did not return the saved class."
                );
            }

            const normalizedClass = {
                id: savedClass.id,
                academicSessionId: savedClass.academic_session_id,
                academicLevelId: savedClass.academic_level_id,
                name: savedClass.name,
            };

            if (isEditing) {
                setClasses((prevClasses) =>
                    prevClasses.map((schoolClass) =>
                        schoolClass.id === normalizedClass.id
                            ? normalizedClass
                            : schoolClass
                    )
                );

                notify({
                    title: "Class updated",
                    message: `${normalizedClass.name} was updated successfully.`,
                });
            } else {
                setClasses((prevClasses) => [
                    ...prevClasses,
                    normalizedClass,
                ]);

                notify({
                    title: "Class created",
                    message: `${normalizedClass.name} was created successfully.`,
                });
            }

            setShowModal(false);
            setEditingClass(null);
        } catch (error) {
            notify({
                title: isEditing
                    ? "Unable to update class"
                    : "Unable to create class",
                message: error.message || "Please try again.",
            });
        }
    };

    const handleDeleteClass = async () => {
        if (!canDeleteClass || !classToDelete) {
            return;
        }

        try {
            await apiRequest(`/classes/${classToDelete.id}`, {
                method: "DELETE",
            });

            setClasses((prevClasses) =>
                prevClasses.filter(
                    (schoolClass) =>
                        schoolClass.id !== classToDelete.id
                )
            );

            notify({
                title: "Class deleted",
                message: `${classToDelete.name} was deleted successfully.`,
            });
        } catch (error) {
            notify({
                title: "Unable to delete class",
                message: error.message || "Please try again.",
            });
        } finally {
            setClassToDelete(null);
        }
    };

    return (
        <div className="classes-page">
            <div className="classes-page__header">
                <h1>Classes</h1>

                {canCreateClass && (
                    <button
                        className="classes-page__button"
                        onClick={() => {
                            setEditingClass(null);
                            setShowModal(true);
                        }}
                    >
                        + Add Class
                    </button>
                )}
            </div>

            <div className="classes-page__filters">
                <input
                    type="text"
                    placeholder="Search classes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                >
                    <option value="">All Levels</option>

                    {availableLevels.map((level) => (
                        <option
                            key={level.id}
                            value={level.id}
                        >
                            {level.name}
                        </option>
                    ))}
                </select>
            </div>

            <ClassTable
                classes={currentClasses}
                academicLevels={academicLevels}
                academicSessions={academicSessions}
                canEdit={canEditClass}
                canDelete={canDeleteClass}
                onEdit={(schoolClass) => {
                    if (!canEditClass) {
                        return;
                    }

                    setEditingClass(schoolClass);
                    setShowModal(true);
                }}
                onDelete={(classId) => {
                    if (!canDeleteClass) {
                        return;
                    }

                    const selectedClass = classes.find(
                        (schoolClass) => schoolClass.id === classId
                    );

                    if (selectedClass) {
                        setClassToDelete(selectedClass);
                    }
                }}
            />

            {totalPages > 1 && (
                <div className="classes-page__pagination">
                    <button
                        onClick={() =>
                            setCurrentPage((prev) => prev - 1)
                        }
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>

                    <span>
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        onClick={() =>
                            setCurrentPage((prev) => prev + 1)
                        }
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}

            {classToDelete && (
                <ConfirmDialog
                    title="Delete Class"
                    message={`Are you sure you want to delete ${classToDelete.name}?`}
                    onCancel={() => setClassToDelete(null)}
                    onConfirm={handleDeleteClass}
                />
            )}

            {showModal && (
                <ClassModal
                    onClose={() => {
                        setShowModal(false);
                        setEditingClass(null);
                    }}
                    editingClass={editingClass}
                    academicLevels={academicLevels}
                    academicSessions={academicSessions}
                    onAddClass={handleSaveClass}
                />
            )}

            {showNotification && (
                <NotificationDialog
                    title={notification.title}
                    message={notification.message}
                    onClose={() => setShowNotification(false)}
                />
            )}
        </div>
    );
};

export default Classes;
