import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import SectionTable from "../../components/classes/SectionTable/SectionTable";
import SectionModal from "../../components/classes/SectionModal/SectionModal";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import NotificationDialog from "../../components/common/NotificationDialog/NotificationDialog";
import { useAuth } from "../../auth/AuthContext";
import { hasPermission } from "../../auth/permissions";
import "./Sections.css";


const Sections = () => {
   

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

            const canCreateSection = hasPermission(
                currentUser?.role,
                "sections",
                "create"
            );

            const canEditSection = hasPermission(
                currentUser?.role,
                "sections",
                "edit"
            );

            const canDeleteSection = hasPermission(
                currentUser?.role,
                "sections",
                "delete"
            );
           
    // 



    const {
        sections,
        setSections,
        classes,
        teachers,
        
    } = useOutletContext();

    const [showModal, setShowModal] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [sectionToDelete, setSectionToDelete] = useState(null);

    const [showNotification, setShowNotification] = useState(false);

    const [notification, setNotification] = useState({
        title: "",
        message: "",
    });

    const notify = ({ title, message }) => {
        setNotification({ title, message });
        setShowNotification(true);
    };

    const [searchTerm, setSearchTerm] = useState("");
    const [classFilter, setClassFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);

    const sectionsPerPage = 5;



    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, classFilter]);


    // Filter sections
    const filteredSections = sections.filter((section) => {

        const search = searchTerm.toLowerCase();

        const schoolClass = classes.find(
            (schoolClass) =>
                schoolClass.id === section.classId
        );

        const teacher = teachers.find(
            (teacher) =>
                teacher.schoolStaffId === section.classTeacherId
        );

        const teacherName = teacher
            ? `${teacher.firstName} ${teacher.lastName}`
            : "";

        const matchesSearch =
            section.name.toLowerCase().includes(search) ||
            schoolClass?.name.toLowerCase().includes(search) ||
            teacherName.toLowerCase().includes(search) ||
            section.room.toLowerCase().includes(search);

        const matchesClass =
            classFilter === "" ||
            String(section.classId) === classFilter;

        return matchesSearch && matchesClass;
    });


    // Pagination
    const totalPages = Math.ceil(
        filteredSections.length / sectionsPerPage
    );

    const startIndex =
        (currentPage - 1) * sectionsPerPage;

    const currentSections = filteredSections.slice(
        startIndex,
        startIndex + sectionsPerPage
    );


    return (
        <div className="sections-page">

            {/* Header */}

            <div className="sections-page__header">

                <h1>Sections</h1>

                {canCreateSection && (
                    <button
                        className="sections-page__button"
                        onClick={() => {
                            setEditingSection(null);
                            setShowModal(true);
                        }}
                    >
                        + Add Section
                    </button>
                )}

            </div>


            {/* Filters */}

            <div className="sections-page__filters">

                <input
                    type="text"
                    placeholder="Search sections..."
                    value={searchTerm}
                    onChange={(e) =>
                        setSearchTerm(e.target.value)
                    }
                />


                <select
                    value={classFilter}
                    onChange={(e) =>
                        setClassFilter(e.target.value)
                    }
                >
                    <option value="">
                        All Classes
                    </option>

                    {classes.map((schoolClass) => (
                        <option
                            key={schoolClass.id}
                            value={schoolClass.id}
                        >
                            {schoolClass.name}
                        </option>
                    ))}

                </select>

            </div>


            {/* Table */}

            <SectionTable
                sections={currentSections}
                classes={classes}
                teachers={teachers}
                canEdit={canEditSection}
                canDelete={canDeleteSection}

                onEdit={(section) => {
                     if (!canEditSection) {
                            return;
                        }


                    setEditingSection(section);
                    setShowModal(true);
                }}

                onDelete={(sectionId) => {
                    if (!canDeleteSection) {
                        return;
                    }



                    const selectedSection =
                        sections.find(
                            (section) =>
                                section.id === sectionId
                        );

                    setSectionToDelete(selectedSection);
                }}
            />


            {/* Pagination */}

            {totalPages > 1 && (
                <div className="sections-page__pagination">

                    <button
                        onClick={() =>
                            setCurrentPage(
                                (prev) => prev - 1
                            )
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
                            setCurrentPage(
                                (prev) => prev + 1
                            )
                        }
                        disabled={
                            currentPage === totalPages
                        }
                    >
                        Next
                    </button>

                </div>
            )}


            {/* Delete confirmation */}

            {sectionToDelete && (
                <ConfirmDialog
                    title="Delete Section"
                    message={`Are you sure you want to delete ${sectionToDelete.name}?`}
                    onCancel={() =>
                        setSectionToDelete(null)
                    }
                   onConfirm={async () => {
                        if (!canDeleteSection) {
                            return;
                        }

                        try {
                            await apiRequest(`/sections/${sectionToDelete.id}`, {
                                method: "DELETE",
                            });

                            setSections((prevSections) =>
                                prevSections.filter(
                                    (section) => section.id !== sectionToDelete.id
                                )
                            );

                            setSectionToDelete(null);

                            notify({
                                title: "Section deleted",
                                message: "The section was deleted successfully.",
                            });
                        } catch (error) {
                            notify({
                                title: "Unable to delete section",
                                message: error.message || "Please try again.",
                            });
                        }
                    }}
                />
            )}


            {/* Add/Edit modal */}

            {showModal && (
                <SectionModal
                    classes={classes}
                      teachers={teachers}
                    onClose={() => {
                        setShowModal(false);
                        setEditingSection(null);
                    }}

                    editingSection={editingSection}

                    onAddSection={async (sectionData) => {
                        const isEditing = Boolean(editingSection);

                        try {
                            const data = await apiRequest(
                                isEditing
                                    ? `/sections/${editingSection.id}`
                                    : "/sections",
                                {
                                    method: isEditing ? "PATCH" : "POST",
                                    body: JSON.stringify(sectionData),
                                }
                            );

                            const savedSection = data.section;

                            if (!savedSection?.id) {
                                throw new Error(
                                    "The server did not return the saved section."
                                );
                            }

                            const normalizedSection = {
                                id: savedSection.id,
                                classId: savedSection.class_id,
                                name: savedSection.name,
                                classTeacherId: savedSection.class_teacher_id || "",
                                room: savedSection.room || "",
                                capacity: savedSection.capacity ?? "",
                            };

                            if (isEditing) {
                                setSections((prevSections) =>
                                    prevSections.map((section) =>
                                        section.id === normalizedSection.id
                                            ? normalizedSection
                                            : section
                                    )
                                );

                                notify({
                                    title: "Section updated",
                                    message: `Section ${normalizedSection.name} was updated successfully.`,
                                });
                            } else {
                                setSections((prevSections) => [
                                    ...prevSections,
                                    normalizedSection,
                                ]);

                                notify({
                                    title: "Section created",
                                    message: `Section ${normalizedSection.name} was created successfully.`,
                                });
                            }

                            setShowModal(false);
                            setEditingSection(null);

                        } catch (error) {
                            notify({
                                title: isEditing
                                    ? "Unable to update section"
                                    : "Unable to create section",
                                message: error.message || "Please try again.",
                            });
                        }
                    }}
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

export default Sections;