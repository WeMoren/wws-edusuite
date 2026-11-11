

import React, { useEffect, useState } from "react";

import "./SectionModal.css";



const initialSection = {
    classId: "",
    name: "",
    classTeacherId: "",
    room: "",
    capacity: ""
};

const SectionModal = ({
    onClose,
    onAddSection,
    editingSection,
    classes,
    teachers
}) => {
    const [sectionData, setSectionData] = useState(initialSection);

    useEffect(() => {
        if (editingSection) {
            setSectionData({
                ...initialSection,
                ...editingSection,
                classId: editingSection.classId || "",
                classTeacherId: editingSection.classTeacherId || "",
                capacity: editingSection.capacity ?? ""
            });
        } else {
            setSectionData(initialSection);
        }
    }, [editingSection]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setSectionData((prev) => ({
            ...prev,
            [name]:
                name === "capacity"
                    ? value === "" ? "" : Number(value)
                    : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        onAddSection({
            ...sectionData,
            classTeacherId: sectionData.classTeacherId || null,
            capacity: sectionData.capacity === ""
                ? null
                : Number(sectionData.capacity)
        });
    };

    return (
        <div
            className="section-modal__overlay"
            onClick={onClose}
        >
            <div
                className="section-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="section-modal__header">
                    <h2>
                        {editingSection ? "Edit Section" : "Add Section"}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Class */}
                    <div className="section-form__group">
                        <label htmlFor="classId">
                            Class
                        </label>

                        <select
                            id="classId"
                            name="classId"
                            value={sectionData.classId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">
                                Select class
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

                    {/* Section */}
                                        
                    <div className="section-form__group">
                        <label htmlFor="name">
                            Section
                        </label>

                        <input
                            id="name"
                            type="text"
                            name="name"
                            value={sectionData.name}
                            onChange={handleChange}
                            placeholder="e.g. A, B, Gold, Blue"
                            required
                        />
                    </div>

                    {/* Class Teacher */}
                    <div className="section-form__group">
                        <label htmlFor="classTeacherId">
                            Class Teacher
                        </label>

                        <select
                            id="classTeacherId"
                            name="classTeacherId"
                            value={sectionData.classTeacherId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">
                                Select a teacher
                            </option>

                            {teachers.map((teacher) => (
                                <option
                                    key={teacher.schoolStaffId}
                                    value={teacher.schoolStaffId}
                                >
                                    {teacher.firstName}{" "}
                                    {teacher.lastName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Room */}
                    <div className="section-form__group">
                        <label htmlFor="room">
                            Room
                        </label>

                        <input
                            id="room"
                            type="text"
                            name="room"
                            value={sectionData.room}
                            onChange={handleChange}
                            placeholder="e.g. Room 101"
                            required
                        />
                    </div>

                    {/* Capacity */}
                    <div className="section-form__group">
                        <label htmlFor="capacity">
                            Capacity
                        </label>

                        <input
                            id="capacity"
                            type="number"
                            name="capacity"
                            value={sectionData.capacity}
                            onChange={handleChange}
                            placeholder="e.g. 40"
                            min="1"
                            required
                        />
                    </div>

                    <button type="submit">
                        {editingSection ? "Save Changes" : "Add Section"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SectionModal;
