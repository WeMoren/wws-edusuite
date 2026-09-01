import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import SectionTable from "../../components/classes/SectionTable/SectionTable";
import SectionModal from "../../components/classes/SectionModal/SectionModal";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import { useAuth } from "../../auth/AuthContext";
import { hasPermission } from "../../auth/permissions";
import "./Sections.css";


const Sections = () => {
   

    const { currentUser } = useAuth();

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

    const [searchTerm, setSearchTerm] = useState("");
    const [classFilter, setClassFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);

    const sectionsPerPage = 5;


    // Persist sections
    useEffect(() => {
        localStorage.setItem(
            "sections",
            JSON.stringify(sections)
        );
    }, [sections]);


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
                teacher.id === section.classTeacherId
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
            section.classId === Number(classFilter);

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
                    onConfirm={() => {
                         if (!canDeleteSection) {
                            return;
                        }


                        setSections((prevSections) =>
                            prevSections.filter(
                                (section) =>
                                    section.id !==
                                    sectionToDelete.id
                            )
                        );

                        setSectionToDelete(null);
                    }}
                />
            )}


            {/* Add/Edit modal */}

            {showModal && (
                <SectionModal
                    classes={classes}
                    onClose={() => {
                        setShowModal(false);
                        setEditingSection(null);
                    }}

                    editingSection={editingSection}

                    onAddSection={(sectionData) => {

                        if (editingSection) {

                            setSections((prevSections) =>
                                prevSections.map(
                                    (section) =>
                                        section.id ===
                                        editingSection.id
                                            ? {
                                                ...sectionData,
                                                id: editingSection.id
                                            }
                                            : section
                                )
                            );

                        } else {

                            setSections((prevSections) => [
                                ...prevSections,
                                {
                                    ...sectionData,
                                    id:
                                        prevSections.length > 0
                                            ? Math.max(
                                                ...prevSections.map(
                                                    (section) =>
                                                        section.id
                                                )
                                            ) + 1
                                            : 1
                                }
                            ]);
                        }

                        setShowModal(false);
                        setEditingSection(null);
                    }}
                />
            )}

        </div>
    );
};

export default Sections;