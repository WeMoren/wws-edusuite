import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import "./ClassModal.css";
import teachers from "../../../data/teachers";
import academicLevels from "../../../data/academicLevels";
import academicSessions from "../../../data/academicSessions";


const ClassModal = ({
    onClose,
    onAddClass,
    editingClass
}) => {


        const { activeAcademicLevels } = useOutletContext();

    const [classData, setClassData] = useState(
        editingClass || {
            name: "",
            academicLevelId: "",
            academicSessionId: ""
        }
    );

        const availableLevels = academicLevels.filter(
          (level) => activeAcademicLevels.includes(level.id)
    );

        const handleChange = (e) => {
            const { name, value } = e.target;

            setClassData((prev) => ({
                ...prev,
                [name]:
                    name === "academicLevelId" ||
                    name === "academicSessionId"
                        ? Number(value)
                        : value
            }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        onAddClass(classData);
    };

    return (
        <div
            className="class-modal__overlay"
            onClick={onClose}
        >
            <div
                className="class-modal"
                onClick={(e) => e.stopPropagation()}
            >

                <div className="class-modal__header">
                    <h2>
                        {editingClass
                            ? "Edit Class"
                            : "Add Class"
                        }
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>


                <form onSubmit={handleSubmit}>

                    {/* Academic Session */}

                    <div className="class-form__group">
                        <label htmlFor="academicSessionId">
                            Academic Session
                        </label>

                        <select
                            id="academicSessionId"
                            name="academicSessionId"
                            value={classData.academicSessionId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">
                                Select academic session
                            </option>

                            {academicSessions.map((session) => (
                                <option
                                    key={session.id}
                                    value={session.id}
                                >
                                    {session.name}
                                </option>
                            ))}
                        </select>
                    </div>


                    {/* Academic Level */}

                    <div className="class-form__group">
                        <label htmlFor="academicLevelId">
                            Academic Level
                        </label>

                        <select
                            id="academicLevelId"
                            name="academicLevelId"
                            value={classData.academicLevelId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">
                                Select academic level
                            </option>

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


                    {/* Class Name */}

                    <div className="class-form__group">
                        <label htmlFor="name">
                            Class Name
                        </label>

                        <input
                            id="name"
                            type="text"
                            name="name"
                            value={classData.name}
                            onChange={handleChange}
                            placeholder="e.g. JSS 1"
                            required
                        />
                    </div>


                    <button type="submit">
                        {editingClass
                            ? "Save Changes"
                            : "Add Class"
                        }
                    </button>

                </form>
            </div>
        </div>
    );
};

export default ClassModal;