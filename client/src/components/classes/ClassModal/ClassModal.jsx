import React, { useEffect, useState } from "react";
import "./ClassModal.css";

import academicSessions from "../../../data/academicSessions";
import academicLevels from "../../../data/academicLevels";

const sections = ["A", "B", "C", "D", "E"];

const initialClass = {
  academicSessionId: "",
  academicLevelId: "",
  section: "",
};

const ClassModal = ({
  onClose,
  onAddClass,
  editingClass,
}) => {
  const [classData, setClassData] = useState(initialClass);

  useEffect(() => {
    if (editingClass) {
      setClassData({
        academicSessionId: editingClass.academicSessionId,
        academicLevelId: editingClass.academicLevelId,
        section: editingClass.section,
      });
    } else {
      setClassData(initialClass);
    }
  }, [editingClass]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setClassData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedLevel = academicLevels.find(
      (level) => level.id === Number(classData.academicLevelId)
    );

    const className = `${selectedLevel.name}${classData.section}`;

    onAddClass({
      ...classData,
      academicSessionId: Number(classData.academicSessionId),
      academicLevelId: Number(classData.academicLevelId),
      name: className,
    });
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
            {editingClass ? "Edit Class" : "Add Class"}
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

              {academicLevels.map((level) => (
                <option
                  key={level.id}
                  value={level.id}
                >
                  {level.name}
                </option>
              ))}
            </select>
          </div>


          {/* Section */}

          <div className="class-form__group">
            <label htmlFor="section">
              Section
            </label>

            <select
              id="section"
              name="section"
              value={classData.section}
              onChange={handleChange}
              required
            >
              <option value="">
                Select section
              </option>

              {sections.map((section) => (
                <option
                  key={section}
                  value={section}
                >
                  Section {section}
                </option>
              ))}
            </select>
          </div>


          {/* Preview */}

          {classData.academicLevelId &&
            classData.section && (
              <p>
                Class name:{" "}
                <strong>
                  {
                    academicLevels.find(
                      (level) =>
                        level.id ===
                        Number(classData.academicLevelId)
                    )?.name
                  }
                  {classData.section}
                </strong>
              </p>
            )}


          <button type="submit">
            {editingClass
              ? "Save Changes"
              : "Add Class"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default ClassModal;