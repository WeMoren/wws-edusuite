// AcademicSetup.jsx
import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import NotificationDialog from "../../components/common/NotificationDialog/NotificationDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";

import "./AcademicSetup.css";

function generateId(items) {
  if (!items || items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
}

const AcademicSetup = () => {
  // Notification
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ title: "", message: "" });

  // Edit dialog (generic)
  const [editDialog, setEditDialog] = useState({
    open: false,
    type: "",
    item: null,
    value: "",
  });

  // Delete confirmations
  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [levelToDelete, setLevelToDelete] = useState(null);

  // Controlled inputs for add forms
  const [newLevelName, setNewLevelName] = useState("");
  const [newLevelCategory, setNewLevelCategory] = useState("");
  const [newSessionName, setNewSessionName] = useState("");
  const [selectedClassLevel, setSelectedClassLevel] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [newSectionName, setNewSectionName] = useState("");

  // Context state (from parent/outlet)
  const {
    academicLevels,
    setAcademicLevels,
    activeAcademicLevels,
    setActiveAcademicLevels,
    academicSessions,
    setAcademicSessions,
    classes,
    setClasses,
    sections,
    setSections,
  } = useOutletContext();

  // Selected levels (checkboxes)
  const [selectedLevels, setSelectedLevels] = useState(activeAcademicLevels || []);

  useEffect(() => {
    setSelectedLevels(activeAcademicLevels || []);
  }, [activeAcademicLevels]);

  const notify = ({ title, message }) => {
    setNotification({ title, message });
    setShowNotification(true);
  };

  const handleSave = () => {
    setActiveAcademicLevels(selectedLevels);
    notify({ title: "Saved", message: "Academic setup saved." });
  };

  const handleToggle = (levelId) => {
    setSelectedLevels((prev) =>
      prev.includes(levelId) ? prev.filter((id) => id !== levelId) : [...prev, levelId]
    );
  };

  // Add Level
  const handleAddLevel = () => {
    const name = newLevelName.trim();
    const category = newLevelCategory;
    if (!name || !category) {
      notify({ title: "Missing fields", message: "Please enter level name and category." });
      return;
    }

    const newLevel = {
      id: generateId(academicLevels),
      name,
      category,
    };

    setAcademicLevels((prev) => [...prev, newLevel]);
    setNewLevelName("");
    setNewLevelCategory("");
  };

  // Add Session
  const handleAddSession = () => {
    const name = newSessionName.trim();
    if (!name) {
      notify({ title: "Missing session", message: "Please enter a session name." });
      return;
    }

    const newSession = {
      id: generateId(academicSessions),
      name,
    };

    setAcademicSessions((prev) => [...prev, newSession]);
    setNewSessionName("");
  };

  // Add Class
  const handleAddClass = () => {
    if (!selectedClassLevel) {
      notify({ title: "Select level", message: "Please select an academic level." });
      return;
    }

    const levelId = Number(selectedClassLevel);
    const level = academicLevels.find((l) => l.id === levelId);
    if (!level) {
      notify({ title: "Invalid level", message: "Selected academic level not found." });
      return;
    }

    // Use selected session if available, else null
    const sessionId = academicSessions.length > 0 ? academicSessions[0].id : null;

    const alreadyExists = classes.some(
      (c) => c.academicLevelId === levelId && c.academicSessionId === sessionId
    );

    if (alreadyExists) {
      notify({ title: "Class exists", message: "A class for this level and session already exists." });
      return;
    }

    const newClass = {
      id: generateId(classes),
      academicLevelId: levelId,
      academicSessionId: sessionId,
      name: newClassName.trim() || level.name,
    };

    setClasses((prev) => [...prev, newClass]);
    setSelectedClassLevel("");
    setNewClassName("");
  };

  // Add Section
  const handleAddSection = () => {
    if (!selectedClassId) {
      notify({ title: "Select a Class", message: "Please select a class before adding a section." });
      return;
    }

    const sectionName = newSectionName.trim().toUpperCase();
    if (!sectionName) {
      notify({ title: "Section Name Required", message: "Please enter a section name." });
      return;
    }

    if (!["A", "B", "C", "D", "E"].includes(sectionName)) {
      notify({ title: "Invalid Section", message: "Sections must be A, B, C, D, or E." });
      return;
    }

    const classIdNum = Number(selectedClassId);
    const classSections = sections.filter((s) => s.classId === classIdNum);

    if (classSections.length >= 5) {
      notify({ title: "Maximum Sections Reached", message: "A class can have a maximum of 5 sections (A-E)." });
      return;
    }

    const alreadyExists = classSections.some((s) => s.name.toUpperCase() === sectionName);
    if (alreadyExists) {
      notify({ title: "Section Already Exists", message: `Section ${sectionName} already exists for this class.` });
      return;
    }

    const newSection = {
      id: generateId(sections),
      classId: classIdNum,
      name: sectionName,
      classTeacherId: null,
      room: "",
      capacity: 40,
    };

    setSections((prev) => [...prev, newSection]);
    setNewSectionName("");
  };

  // Edit dialog helpers
  const openEditDialog = (type, item, value) => {
    setEditDialog({ open: true, type, item, value });
  };

  const closeEditDialog = () => {
    setEditDialog({ open: false, type: "", item: null, value: "" });
  };

  const handleEditSave = () => {
    const value = editDialog.value.trim();
    if (!value) {
      notify({ title: "Value Required", message: "Please enter a value before saving." });
      return;
    }

    if (editDialog.type === "level") {
      setAcademicLevels((prev) => prev.map((l) => (l.id === editDialog.item.id ? { ...l, name: value } : l)));
    } else if (editDialog.type === "session") {
      setAcademicSessions((prev) => prev.map((s) => (s.id === editDialog.item.id ? { ...s, name: value } : s)));
    } else if (editDialog.type === "class") {
      setClasses((prev) => prev.map((c) => (c.id === editDialog.item.id ? { ...c, name: value } : c)));
    } else if (editDialog.type === "section") {
      const sectionName = value.toUpperCase();
      if (!["A", "B", "C", "D", "E"].includes(sectionName)) {
        notify({ title: "Invalid Section", message: "Sections must be A, B, C, D, or E." });
        return;
      }

      const exists = sections.some(
        (s) =>
          s.id !== editDialog.item.id &&
          s.classId === editDialog.item.classId &&
          s.name.toUpperCase() === sectionName
      );

      if (exists) {
        notify({ title: "Section Already Exists", message: `Section ${sectionName} already exists for this class.` });
        return;
      }

      setSections((prev) => prev.map((s) => (s.id === editDialog.item.id ? { ...s, name: sectionName } : s)));
    }

    closeEditDialog();
  };

  // Edit class (replaced window.prompt with modal flow)
  const handleEditClass = (classItem) => {
    openEditDialog("class", classItem, classItem.name);
  };

  // Delete flows (open confirm dialogs)
  const requestDeleteClass = (classItem) => setClassToDelete(classItem);
  const requestDeleteSession = (session) => setSessionToDelete(session);
  const requestDeleteLevel = (level) => setLevelToDelete(level);
  const requestDeleteSection = (section) => setSectionToDelete(section);

  // Helpers for labels
  const getLevelById = (id) => academicLevels.find((l) => l.id === id);
  const getClassLabel = (classItem) => {
    const level = getLevelById(classItem.academicLevelId);
    return `${level?.name || ""} ${classItem.name}`.trim();
  };

  return (
    <div className="academic-setup-page">
      <div className="academic-setup-page__header">
        <div>
          <h1>Academic Setup</h1>
          <p>Select the academic levels offered by your school.</p>
        </div>

        <button className="academic-setup-page__save" onClick={handleSave}>
          Save Academic Setup
        </button>
      </div>

      <div className="academic-setup">
        {/* Add Academic Level */}
        <div className="academic-levels__form">
          <h2>Add Academic Level</h2>

          <input
            type="text"
            value={newLevelName}
            onChange={(e) => setNewLevelName(e.target.value)}
            placeholder="e.g. Primary 6"
          />

          <select value={newLevelCategory} onChange={(e) => setNewLevelCategory(e.target.value)}>
            <option value="">Select category</option>
            <option value="Early Years">Early Years</option>
            <option value="Kindergarten">Kindergarten</option>
            <option value="Primary">Primary</option>
            <option value="Junior Secondary">Junior Secondary</option>
            <option value="Senior Secondary">Senior Secondary</option>
          </select>

          <button type="button" onClick={handleAddLevel}>
            + Add Level
          </button>
        </div>

        {/* Academic Sessions */}
        <div className="academic-sessions">
          <h2>Academic Sessions</h2>

          <div className="academic-sessions__form">
            <input
              type="text"
              placeholder="e.g. 2026/2027"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
            />

            <button type="button" onClick={handleAddSession}>
              + Add Session
            </button>
          </div>

          <div className="academic-sessions__list">
            {academicSessions.map((session) => (
              <div key={session.id} className="academic-sessions__item">
                <span>{session.name}</span>

                <div className="academic-sessions__actions">
                  <button 
                    className="edit"
                    type="button" onClick={() => openEditDialog("session", session, session.name)}>
                    Edit
                  </button>

                  <button    
                     type="button" 
                     className="delete"
                     onClick={() => requestDeleteSession(session)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Classes */}
        <div className="academic-classes">
          <h2>Classes</h2>

          <div className="academic-classes__form">
            <select value={selectedClassLevel} onChange={(e) => setSelectedClassLevel(e.target.value)}>
              <option value="">Select academic level</option>
              {academicLevels
                .filter((level) => activeAcademicLevels.includes(level.id))
                .map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
            </select>

            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Class name"
            />

            <button type="button" onClick={handleAddClass}>
              + Add Class
            </button>
          </div>

          <div className="academic-classes__list">
            {classes.map((classItem) => {
              const level = getLevelById(classItem.academicLevelId);
              return (
                <div key={classItem.id} className="academic-classes__item">
                  <span>{level?.name}</span>
                  <strong>{classItem.name}</strong>

                  <div className="academic-classes__actions">
                    <button 
                        type="button" 
                        className="edit"
                        onClick={() => handleEditClass(classItem)}
                        
                    >
                      Edit
                    </button>

                    <button 
                        type="button" 
                         className="delete"
                        onClick={() => requestDeleteClass(classItem)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sections */}
        <div className="academic-sections">
          <h2>Sections</h2>

          <div className="academic-sections__form">
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(Number(e.target.value))}>
              <option value="">Select class</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {getClassLabel(classItem)}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Section name e.g. A"
            />

            <button type="button" onClick={handleAddSection}>
              + Add Section
            </button>
          </div>

          <div className="academic-sections__list">
            {classes.map((classItem) => {
              const level = getLevelById(classItem.academicLevelId);
              const classSections = sections.filter((s) => s.classId === classItem.id);
              if (classSections.length === 0) return null;

              return (
                <div key={classItem.id} className="academic-sections__class">
                  <h3>
                    {level?.name} — {classItem.name}
                  </h3>

                  <div className="academic-sections__items">
                    {classSections.map((section) => (
                      <div key={section.id} className="academic-sections__item">
                        <span>
                          {level?.name} {section.name}
                        </span>

                        <div className="academic-sections__actions">
                          <button 
                            type="button" 
                            className="edit"
                            onClick={() => openEditDialog("section", section, section.name)}>
                            Edit
                          </button>

                          <button 
                            type="button" 
                            className="delete"
                            onClick={() => requestDeleteSection(section)}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category level checkboxes */}
        {[
          "Early Years",
          "Kindergarten",
          "Primary",
          "Junior Secondary",
          "Senior Secondary",
        ].map((category) => {
          const categoryLevels = academicLevels.filter((level) => level.category === category);

          return (
            <section key={category} className="academic-setup__category">
              <h2>{category}</h2>

              <div className="academic-setup__levels">
                {categoryLevels.map((level) => (
                  <div key={level.id} className="academic-setup__level">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedLevels.includes(level.id)}
                        onChange={() => handleToggle(level.id)}
                      />
                      <span>{level.name}</span>
                    </label>

                    <div className="academic-level__actions">
                      <button 
                        type="button" 
                        className="edit"
                        onClick={() => openEditDialog("level", level, level.name)}>
                        Edit
                      </button>

                      <button 
                        type="button" 
                        className="delete"
                        onClick={() => requestDeleteLevel(level)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Notification */}
      {showNotification && (
        <NotificationDialog title={notification.title} message={notification.message} onClose={() => setShowNotification(false)} />
      )}

      {/* Confirm dialogs */}
      {sectionToDelete && (
        <ConfirmDialog
          title="Delete Section"
          message={`Are you sure you want to delete section ${sectionToDelete.name}?`}
          onCancel={() => setSectionToDelete(null)}
          onConfirm={() => {
            setSections((prev) => prev.filter((s) => s.id !== sectionToDelete.id));
            setSectionToDelete(null);
          }}
        />
      )}

      {classToDelete && (
        <ConfirmDialog
          title="Delete Class"
          message={`Are you sure you want to delete ${getClassLabel(classToDelete)}?`}
          onCancel={() => setClassToDelete(null)}
          onConfirm={() => {
            setClasses((prev) => prev.filter((c) => c.id !== classToDelete.id));
            // also remove related sections
            setSections((prev) => prev.filter((s) => s.classId !== classToDelete.id));
            setClassToDelete(null);
          }}
        />
      )}

      {sessionToDelete && (
        <ConfirmDialog
          title="Delete Session"
          message={`Are you sure you want to delete session ${sessionToDelete.name}?`}
          onCancel={() => setSessionToDelete(null)}
          onConfirm={() => {
            setAcademicSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id));
            setSessionToDelete(null);
          }}
        />
      )}

      {levelToDelete && (
        <ConfirmDialog
          title="Delete Level"
          message={`Are you sure you want to delete level ${levelToDelete.name}? This will remove related classes.`}
          onCancel={() => setLevelToDelete(null)}
          onConfirm={() => {
            setAcademicLevels((prev) => prev.filter((l) => l.id !== levelToDelete.id));
            setActiveAcademicLevels((prev) => prev.filter((id) => id !== levelToDelete.id));
            // remove classes and sections for that level
            const removedClassIds = classes.filter((c) => c.academicLevelId === levelToDelete.id).map((c) => c.id);
            setClasses((prev) => prev.filter((c) => c.academicLevelId !== levelToDelete.id));
            setSections((prev) => prev.filter((s) => !removedClassIds.includes(s.classId)));
            setLevelToDelete(null);
          }}
        />
      )}

      {/* Edit dialog (simple inline modal) */}
      {editDialog.open && (
        <div className="edit-modal">
          <div className="edit-modal__content">
            <h3>Edit {editDialog.type}</h3>
            <input
              value={editDialog.value}
              onChange={(e) => setEditDialog((d) => ({ ...d, value: e.target.value }))}
            />
            <div className="edit-modal__actions">
              <button onClick={handleEditSave}>Save</button>
              <button onClick={closeEditDialog}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicSetup;
