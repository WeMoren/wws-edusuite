import React from "react";
import "./SectionTable.css";

const SectionTable = ({
    sections,
    classes,
    teachers,
    onEdit,
    onDelete
}) => {

    return (
        <div className="section-table">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Section</th>
                        <th>Class</th>
                        <th>Class Teacher</th>
                        <th>Room</th>
                        <th>Capacity</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {sections.length > 0 ? (
                        sections.map((section) => {

                            const schoolClass = classes.find(
                                (schoolClass) =>
                                    schoolClass.id === section.classId
                            );

                            const teacher = teachers.find(
                                (teacher) =>
                                    teacher.id === section.classTeacherId
                            );

                            return (
                                <tr key={section.id}>
                                    <td>{section.id}</td>

                                    <td>{section.name}</td>

                                    <td>
                                        {schoolClass?.name || "—"}
                                    </td>

                                    <td>
                                        {teacher
                                            ? `${teacher.firstName} ${teacher.lastName}`
                                            : "—"}
                                    </td>

                                    <td>{section.room || "—"}</td>

                                    <td>{section.capacity || "—"}</td>

                                    <td>
                                        <div className="section-table__actions">

                                            <button
                                                className="section-table__edit"
                                                onClick={() =>
                                                    onEdit(section)
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="section-table__delete"
                                                onClick={() =>
                                                    onDelete(section.id)
                                                }
                                            >
                                                Delete
                                            </button>

                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td
                                colSpan="7"
                                className="section-table__empty"
                            >
                                No sections found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default SectionTable;