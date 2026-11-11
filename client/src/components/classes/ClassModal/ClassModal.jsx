
import React, { useEffect, useState } from "react";
import "./ClassModal.css";



const initialClass = {
  academicSessionId: "",
  academicLevelId: "",
  section: "",
};

const ClassModal = ({
  onClose,
  onAddClass,
  editingClass,
  academicSessions,
  academicLevels,
}) => {
  const [classData, setClassData] = useState(initialClass);

  useEffect(() => {
    if (editingClass) {
      const selectedLevel = academicLevels.find(
        (level) => level.id === editingClass.academicLevelId
      );

      const section = selectedLevel
        ? editingClass.name.replace(selectedLevel.name, "")
        : "";

      setClassData({
        academicSessionId: editingClass.academicSessionId,
        academicLevelId: editingClass.academicLevelId,
        section,
      });
    } else {
      setClassData(initialClass);
    }
  }, [editingClass, academicLevels]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setClassData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const selectedLevel = academicLevels.find(
    (level) => level.id === classData.academicLevelId
  );

  const className = selectedLevel
    ? `${selectedLevel.name}${classData.section}`
    : "";

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedLevel || !classData.academicSessionId) {
      return;
    }

    onAddClass({
      academicSessionId: classData.academicSessionId,
      academicLevelId: classData.academicLevelId,
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

          {/* Class Name Suffix */}

          
          <div className="class-form__group">
            <label htmlFor="section">
              Class Name Suffix
            </label>

            <input
              id="section"
              type="text"
              name="section"
              value={classData.section}
              onChange={handleChange}
              placeholder="e.g. A, B, Gold, Blue"
              required
            />
          </div>


          {/* Class Name Preview */}

          {selectedLevel && classData.section && (
            <p>
              Class name: <strong>{className}</strong>
            </p>
          )}

          <button type="submit">
            {editingClass ? "Save Changes" : "Add Class"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClassModal;
