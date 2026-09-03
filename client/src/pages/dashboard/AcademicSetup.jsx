import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import NotificationDialog from "../../components/common/NotificationDialog/NotificationDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";

import "./AcademicSetup.css";

function generateId(items) {
  if (!items || items.length === 0) return 1;

  return Math.max(...items.map((item) => item.id)) + 1;
}

const AcademicSetup = () => {
  // Notification
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({
    title: "",
    message: "",
  });

  // Edit dialog
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
  const [termToDelete, setTermToDelete] = useState(null);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [gradeToDelete, setGradeToDelete] = useState(null);
  const [gradeToEdit, setGradeToEdit] = useState(null);
  



  const [subjectLevelDialog, setSubjectLevelDialog] = useState({
  open: false,
  subject: null,
  selectedLevels: [],
});

  // Controlled inputs
  const [newLevelName, setNewLevelName] = useState("");
  const [newLevelCategory, setNewLevelCategory] = useState("");
  const [newSessionName, setNewSessionName] = useState("");
  const [selectedTermSession, setSelectedTermSession] = useState("");
  const [newTermName, setNewTermName] = useState("");
  const [selectedClassLevel, setSelectedClassLevel] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
    const [newStreamName, setNewStreamName] = useState("");
  const [newStreamCode, setNewStreamCode] = useState("");
  const [newStreamDescription, setNewStreamDescription] = useState("");

    const [streamLevelDialog, setStreamLevelDialog] = useState({
    open: false,
    stream: null,
    selectedLevels: [],
  });

  const [newCombinationLevelId, setNewCombinationLevelId] = useState("");
  const [newCombinationStreamId, setNewCombinationStreamId] = useState("");
  const [newCombinationName, setNewCombinationName] = useState("");
  const [newCombinationCode, setNewCombinationCode] = useState("");

  const [combinationSubjectDialog, setCombinationSubjectDialog] =
    useState({
      open: false,
      combination: null,
      selectedSubjects: [],
    });

  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectCategory, setNewSubjectCategory] = useState("");
  const [newSubjectIsCore, setNewSubjectIsCore] = useState(true);
  const [newGradeMin, setNewGradeMin] = useState("");
  const [newGradeMax, setNewGradeMax] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newGradeRemark, setNewGradeRemark] = useState("");
 

        // Persist assessment structure
    const [caMax, setCaMax] = useState(() => {
        const savedAssessment = localStorage.getItem("assessmentSettings");

        if (savedAssessment) {
          const parsedAssessment = JSON.parse(savedAssessment);
          return parsedAssessment.caMax;
        }

        return 30;
      });

      const [examMax, setExamMax] = useState(() => {
        const savedAssessment = localStorage.getItem("assessmentSettings");

        if (savedAssessment) {
          const parsedAssessment = JSON.parse(savedAssessment);
          return parsedAssessment.examMax;
        }

        return 70;
    });


    useEffect(() => {
      localStorage.setItem(
        "assessmentSettings",
        JSON.stringify({
          caMax: Number(caMax),
          examMax: Number(examMax),
        })
      );
    }, [caMax, examMax]);
    

      // Grading rules
    const [gradingScale, setGradingScale] = useState(() => {
      const savedGradingScale = localStorage.getItem("gradingScale");

      if (savedGradingScale) {
        return JSON.parse(savedGradingScale);
      }

      return [
        {
          id: 1,
          min: 90,
          max: 100,
          grade: "A1",
          remark: "Excellent",
        },
        {
          id: 2,
          min: 80,
          max: 89,
          grade: "B2",
          remark: "Very Good",
        },
        {
          id: 3,
          min: 70,
          max: 79,
          grade: "B3",
          remark: "Good",
        },
        {
          id: 4,
          min: 60,
          max: 69,
          grade: "C4",
          remark: "Credit",
        },
        {
          id: 5,
          min: 50,
          max: 59,
          grade: "C5",
          remark: "Credit",
        },
        {
          id: 6,
          min: 45,
          max: 49,
          grade: "D7",
          remark: "Pass",
        },
        {
          id: 7,
          min: 40,
          max: 44,
          grade: "E8",
          remark: "Pass",
        },
        {
          id: 8,
          min: 0,
          max: 39,
          grade: "F9",
          remark: "Fail",
        },
      ];
  });

    
    // Persistence effect for grading scale edit 

    useEffect(() => {
        localStorage.setItem(
          "gradingScale",
          JSON.stringify(gradingScale)
        );
    }, [gradingScale]);



  // Context state
  const {
    academicLevels,
    setAcademicLevels,
    activeAcademicLevels,
    setActiveAcademicLevels,
    academicSessions,
    setAcademicSessions,
    academicTerms,
    setAcademicTerms,
     subjects,
    setSubjects,
    classes,
    setClasses,
    sections,
    setSections,
     streams,
    setStreams,
    streamLevels,
    setStreamLevels,
    subjectCombinations,
    setSubjectCombinations,
   
  } = useOutletContext();

      // Selected academic levels
      const [selectedLevels, setSelectedLevels] = useState(
        activeAcademicLevels || []
      );

      useEffect(() => {
        setSelectedLevels(activeAcademicLevels || []);
      }, [activeAcademicLevels]);


  const notify = ({ title, message }) => {
    setNotification({ title, message });
    setShowNotification(true);
  };

  const handleSave = () => {
    setActiveAcademicLevels(selectedLevels);

    notify({
      title: "Saved",
      message: "Academic setup saved.",
    });
  };

  const handleToggle = (levelId) => {
    setSelectedLevels((prev) =>
      prev.includes(levelId)
        ? prev.filter((id) => id !== levelId)
        : [...prev, levelId]
    );
  };

  // Add Academic Level
  const handleAddLevel = () => {
    const name = newLevelName.trim();
    const category = newLevelCategory;

    if (!name || !category) {
      notify({
        title: "Missing fields",
        message: "Please enter level name and category.",
      });

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

  // Add Academic Session
  const handleAddSession = () => {
    const name = newSessionName.trim();

    if (!name) {
      notify({
        title: "Missing session",
        message: "Please enter a session name.",
      });

      return;
    }

    const newSession = {
      id: generateId(academicSessions),
      name,
    };

    setAcademicSessions((prev) => [...prev, newSession]);

    setNewSessionName("");
  };

  // Add Academic Term
  const handleAddTerm = () => {
    if (!selectedTermSession) {
      notify({
        title: "Select Session",
        message: "Please select an academic session.",
      });

      return;
    }

    const name = newTermName.trim();

    if (!name) {
      notify({
        title: "Term Required",
        message: "Please enter a term name.",
      });

      return;
    }

    const sessionId = Number(selectedTermSession);

    const alreadyExists = academicTerms.some(
      (term) =>
        term.academicSessionId === sessionId &&
        term.name.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      notify({
        title: "Term Already Exists",
        message: `${name} already exists for this academic session.`,
      });

      return;
    }

    const newTerm = {
      id: generateId(academicTerms),
      academicSessionId: sessionId,
      name,
    };

    setAcademicTerms((prev) => [...prev, newTerm]);

    setNewTermName("");
  };


    // Add Stream
  const handleAddStream = () => {
    const name = newStreamName.trim();
    const code = newStreamCode.trim().toUpperCase();
    const description = newStreamDescription.trim();

    if (!name || !code) {
      notify({
        title: "Missing fields",
        message: "Please enter a stream name and code.",
      });

      return;
    }

    const alreadyExists = streams.some(
      (stream) =>
        stream.name.toLowerCase() === name.toLowerCase() ||
        stream.code.toLowerCase() === code.toLowerCase()
    );

    if (alreadyExists) {
      notify({
        title: "Stream exists",
        message: "A stream with this name or code already exists.",
      });

      return;
    }

    const newStream = {
      id: generateId(streams),
      name,
      code,
      description,
      isActive: true,
    };

    setStreams((prev) => [...prev, newStream]);

    setNewStreamName("");
    setNewStreamCode("");
    setNewStreamDescription("");

    notify({
      title: "Stream Added",
      message: `${name} has been added successfully.`,
    });
  };


  const handleAddCombination = () => {
  const academicLevelId = Number(newCombinationLevelId);
  const streamId = Number(newCombinationStreamId);
  const name = newCombinationName.trim();
  const code = newCombinationCode.trim().toUpperCase();

  if (!academicLevelId || !streamId || !name || !code) {
    notify({
      title: "Missing fields",
      message:
        "Please select an academic level and stream, then enter a combination name and code.",
    });
    return;
  }

  const selectedStream = streams.find(
    (stream) => stream.id === streamId
  );

  if (!selectedStream) {
    notify({
      title: "Invalid stream",
      message: "The selected stream could not be found.",
    });
    return;
  }

  const streamIsAvailable = streamLevels.some(
    (streamLevel) =>
      streamLevel.academicLevelId === academicLevelId &&
      streamLevel.streamId === streamId &&
      streamLevel.isActive
  );

  if (!streamIsAvailable) {
    notify({
      title: "Stream unavailable",
      message:
        "The selected stream is not assigned to this academic level.",
    });
    return;
  }

  const alreadyExists = subjectCombinations.some(
    (combination) =>
      combination.academicLevelId === academicLevelId &&
      combination.streamId === streamId &&
      (combination.name.toLowerCase() === name.toLowerCase() ||
        combination.code.toLowerCase() === code.toLowerCase())
  );

  if (alreadyExists) {
    notify({
      title: "Combination exists",
      message:
        "A combination with this name or code already exists for the selected stream and academic level.",
    });
    return;
  }

  const newCombination = {
    id: generateId(subjectCombinations),
    academicLevelId,
    streamId,
    name,
    code,
    subjectIds: [],
    isActive: true,
  };

  setSubjectCombinations((prev) => [
    ...prev,
    newCombination,
  ]);

  setNewCombinationLevelId("");
  setNewCombinationStreamId("");
  setNewCombinationName("");
  setNewCombinationCode("");

  notify({
    title: "Combination Added",
    message: `${name} has been added successfully.`,
  });
};


const handleAddSubject = () => {
  const name = newSubjectName.trim();
  const code = newSubjectCode.trim().toUpperCase();
  const category = newSubjectCategory.trim();

  if (!name || !code || !category) {
    notify({
      title: "Missing fields",
      message: "Please enter subject name, code, and category.",
    });
    return;
  }

  const alreadyExists = subjects.some(
    (subject) =>
      subject.name.toLowerCase() === name.toLowerCase() ||
      subject.code.toLowerCase() === code.toLowerCase()
  );

  if (alreadyExists) {
    notify({
      title: "Subject exists",
      message: "A subject with this name or code already exists.",
    });
    return;
  }

  const newSubject = {
    id: generateId(subjects),
    name,
    code,
    category,
    isCore: newSubjectIsCore,
    academicLevelIds: [], // Initialize with an empty array for academic level IDs
  };

  setSubjects((prev) => [...prev, newSubject]);

  setNewSubjectName("");
  setNewSubjectCode("");
  setNewSubjectCategory("");
  setNewSubjectIsCore(true);
};


  // Add Class
  const handleAddClass = () => {
    if (!selectedClassLevel) {
      notify({
        title: "Select level",
        message: "Please select an academic level.",
      });

      return;
    }

    const levelId = Number(selectedClassLevel);

    const level = academicLevels.find(
      (academicLevel) => academicLevel.id === levelId
    );

    if (!level) {
      notify({
        title: "Invalid level",
        message: "Selected academic level not found.",
      });

      return;
    }

    const sessionId =
      academicSessions.length > 0 ? academicSessions[0].id : null;

    const alreadyExists = classes.some(
      (classItem) =>
        classItem.academicLevelId === levelId &&
        classItem.academicSessionId === sessionId
    );

    if (alreadyExists) {
      notify({
        title: "Class exists",
        message:
          "A class for this level and session already exists.",
      });

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
      notify({
        title: "Select a Class",
        message: "Please select a class before adding a section.",
      });

      return;
    }

    const sectionName = newSectionName.trim().toUpperCase();

    if (!sectionName) {
      notify({
        title: "Section Name Required",
        message: "Please enter a section name.",
      });

      return;
    }

    if (!["A", "B", "C", "D", "E"].includes(sectionName)) {
      notify({
        title: "Invalid Section",
        message: "Sections must be A, B, C, D, or E.",
      });

      return;
    }

    const classIdNum = Number(selectedClassId);

    const classSections = sections.filter(
      (section) => section.classId === classIdNum
    );

    if (classSections.length >= 5) {
      notify({
        title: "Maximum Sections Reached",
        message:
          "A class can have a maximum of 5 sections (A-E).",
      });

      return;
    }

    const alreadyExists = classSections.some(
      (section) =>
        section.name.toUpperCase() === sectionName
    );

    if (alreadyExists) {
      notify({
        title: "Section Already Exists",
        message:
          `Section ${sectionName} already exists for this class.`,
      });

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
    setEditDialog({
      open: true,
      type,
      item,
      value,
    });
  };

  const closeEditDialog = () => {
    setEditDialog({
      open: false,
      type: "",
      item: null,
      value: "",
    });
  };

  // Save edit
  const handleEditSave = () => {
    const value = editDialog.value.trim();

    if (!value) {
      notify({
        title: "Value Required",
        message: "Please enter a value before saving.",
      });

      return;
    }

    if (editDialog.type === "level") {
      setAcademicLevels((prev) =>
        prev.map((level) =>
          level.id === editDialog.item.id
            ? { ...level, name: value }
            : level
        )
      );
    } else if (editDialog.type === "session") {
      setAcademicSessions((prev) =>
        prev.map((session) =>
          session.id === editDialog.item.id
            ? { ...session, name: value }
            : session
        )
      );
    } else if (editDialog.type === "term") {
      const exists = academicTerms.some(
        (term) =>
          term.id !== editDialog.item.id &&
          term.academicSessionId ===
            editDialog.item.academicSessionId &&
          term.name.toLowerCase() === value.toLowerCase()
      );

      if (exists) {
        notify({
          title: "Term Already Exists",
          message:
            `${value} already exists for this academic session.`,
        });

        return;
      }

      setAcademicTerms((prev) =>
        prev.map((term) =>
          term.id === editDialog.item.id
            ? { ...term, name: value }
            : term
        )
      );


      } else if (editDialog.type === "subject") { 
        const value = editDialog.value.trim();

        const exists = subjects.some(
          (subject) =>
            subject.id !== editDialog.item.id &&
            subject.name.toLowerCase() === value.toLowerCase()
        );

        if (exists) {
          notify({
            title: "Subject Already Exists",
            message: `${value} already exists.`,
          });
          return;
        }

        setSubjects((prev) =>
          prev.map((subject) =>
            subject.id === editDialog.item.id
              ? { ...subject, name: value }
              : subject
          )
        );




    } else if (editDialog.type === "class") {
      setClasses((prev) =>
        prev.map((classItem) =>
          classItem.id === editDialog.item.id
            ? { ...classItem, name: value }
            : classItem
        )
      );
    } else if (editDialog.type === "section") {
      const sectionName = value.toUpperCase();

      if (!["A", "B", "C", "D", "E"].includes(sectionName)) {
        notify({
          title: "Invalid Section",
          message:
            "Sections must be A, B, C, D, or E.",
        });

        return;
      }

      const exists = sections.some(
        (section) =>
          section.id !== editDialog.item.id &&
          section.classId === editDialog.item.classId &&
          section.name.toUpperCase() === sectionName
      );

      if (exists) {
        notify({
          title: "Section Already Exists",
          message:
            `Section ${sectionName} already exists for this class.`,
        });

        return;
      }

      setSections((prev) =>
        prev.map((section) =>
          section.id === editDialog.item.id
            ? { ...section, name: sectionName }
            : section
        )
      );
    }

    closeEditDialog();
  };

  // Edit class
  const handleEditClass = (classItem) => {
    openEditDialog("class", classItem, classItem.name);
  };


   // Add grade
    const handleAddGrade = () => {
      const min = Number(newGradeMin);
      const max = Number(newGradeMax);

      if (
        newGradeMin === "" ||
        newGradeMax === "" ||
        !newGrade.trim() ||
        !newGradeRemark.trim()
      ) {
        notify({
          title: "Incomplete Grade",
          message: "Please fill in all grading fields.",
        });
        return;
      }

      if (min < 0 || max > 100 || min > max) {
        notify({
          title: "Invalid Range",
          message: "Please enter a valid score range between 0 and 100.",
        });
        return;
      }

      const overlaps = gradingScale.some(
        (grading) => min <= grading.max && max >= grading.min
      );

      if (overlaps) {
        notify({
          title: "Overlapping Range",
          message: "This score range overlaps an existing grading range.",
        });
        return;
      }

      setGradingScale((prev) => [
        ...prev,
        {
          id: Date.now(),
          min,
          max,
          grade: newGrade.trim(),
          remark: newGradeRemark.trim(),
        },
      ]);

      setNewGradeMin("");
      setNewGradeMax("");
      setNewGrade("");
      setNewGradeRemark("");

      notify({
        title: "Grade Added",
        message: `${newGrade.trim()} grading rule has been added.`,
      });
  };



    const handleUpdateGrade = () => {
        if (!gradeToEdit) {
          return;
        }

        const min = Number(gradeToEdit.min);
        const max = Number(gradeToEdit.max);

        if (
          gradeToEdit.min === "" ||
          gradeToEdit.max === "" ||
          !gradeToEdit.grade.trim() ||
          !gradeToEdit.remark.trim()
        ) {
          notify({
            title: "Incomplete Grade",
            message: "Please fill in all grading fields.",
          });
          return;
        }

        if (min < 0 || max > 100 || min > max) {
          notify({
            title: "Invalid Range",
            message: "Please enter a valid score range between 0 and 100.",
          });
          return;
        }

        const overlaps = gradingScale.some(
          (grading) =>
            grading.id !== gradeToEdit.id &&
            min <= grading.max &&
            max >= grading.min
        );

        if (overlaps) {
          notify({
            title: "Overlapping Range",
            message: "This score range overlaps an existing grading range.",
          });
          return;
        }

        setGradingScale((prev) =>
          prev.map((grading) =>
            grading.id === gradeToEdit.id
              ? {
                  ...grading,
                  min,
                  max,
                  grade: gradeToEdit.grade.trim(),
                  remark: gradeToEdit.remark.trim(),
                }
              : grading
          )
        );

        setGradeToEdit(null);

        notify({
          title: "Grade Updated",
          message: "The grading rule has been updated successfully.",
        });
    };



  // Delete requests
  const requestDeleteClass = (classItem) => {
    setClassToDelete(classItem);
  };

  const requestDeleteSession = (session) => {
    setSessionToDelete(session);
  };

  const requestDeleteLevel = (level) => {
    setLevelToDelete(level);
  };

  const requestDeleteSection = (section) => {
    setSectionToDelete(section);
  };

  const requestDeleteTerm = (term) => {
    setTermToDelete(term);
  };


  const requestDeleteSubject = (subject) => setSubjectToDelete(subject);

  const requestDeleteGrade = (grading) => setGradeToDelete(grading);

 

  // Helpers
  const getLevelById = (id) =>
    academicLevels.find((level) => level.id === id);

  const getClassLabel = (classItem) => {
    const level = getLevelById(classItem.academicLevelId);

    return `${level?.name || ""} ${classItem.name}`.trim();
  };

  return (
    <div className="academic-setup-page">
      <div className="academic-setup-page__header">
        <div>
          <h1>Academic Setup</h1>
          <p>
            Select the academic levels offered by your school.
          </p>
        </div>

        <button
          className="academic-setup-page__save"
          onClick={handleSave}
        >
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

          <select
            value={newLevelCategory}
            onChange={(e) =>
              setNewLevelCategory(e.target.value)
            }
          >
            <option value="">Select category</option>
            <option value="Early Years">Early Years</option>
            <option value="Kindergarten">Kindergarten</option>
            <option value="Primary">Primary</option>
            <option value="Junior Secondary">
              Junior Secondary
            </option>
            <option value="Senior Secondary">
              Senior Secondary
            </option>
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
              onChange={(e) =>
                setNewSessionName(e.target.value)
              }
            />

            <button
              type="button"
              onClick={handleAddSession}
            >
              + Add Session
            </button>
          </div>

          <div className="academic-sessions__list">
            {academicSessions.map((session) => (
              <div
                key={session.id}
                className="academic-sessions__item"
              >
                <span>{session.name}</span>

                <div className="academic-sessions__actions">
                  <button
                    className="edit"
                    type="button"
                    onClick={() =>
                      openEditDialog(
                        "session",
                        session,
                        session.name
                      )
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete"
                    onClick={() =>
                      requestDeleteSession(session)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Academic Terms */}
        <div className="academic-terms">
          <h2>Academic Terms</h2>

          <div className="academic-terms__form">
            <select
              value={selectedTermSession}
              onChange={(e) =>
                setSelectedTermSession(e.target.value)
              }
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

            <input
              type="text"
              value={newTermName}
              onChange={(e) =>
                setNewTermName(e.target.value)
              }
              placeholder="e.g. First Term"
            />

            <button
              type="button"
              onClick={handleAddTerm}
            >
              + Add Term
            </button>
          </div>

          <div className="academic-terms__list">
            {academicTerms.map((term) => {
              const session = academicSessions.find(
                (item) =>
                  item.id === term.academicSessionId
              );

              return (
                <div
                  key={term.id}
                  className="academic-terms__item"
                >
                  <div>
                    <strong>{term.name}</strong>

                    <span>
                      {session?.name ||
                        "Session Unavailable"}
                    </span>
                  </div>

                  <div className="academic-terms__actions">
                    <button
                      type="button"
                      className="edit"
                      onClick={() =>
                        openEditDialog(
                          "term",
                          term,
                          term.name
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete"
                      onClick={() =>
                        requestDeleteTerm(term)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>



                      {/* Streams */}
        <div className="academic-streams">
          <h2>Streams</h2>

          <p>
            Configure the streams offered by your school and the academic
            levels where each stream is available.
          </p>

          <div className="academic-streams__form">
            <input
              type="text"
              value={newStreamName}
              onChange={(e) => setNewStreamName(e.target.value)}
              placeholder="Stream name e.g. Science"
            />

            <input
              type="text"
              value={newStreamCode}
              onChange={(e) => setNewStreamCode(e.target.value)}
              placeholder="Stream code e.g. SCI"
            />

            <input
              type="text"
              value={newStreamDescription}
              onChange={(e) =>
                setNewStreamDescription(e.target.value)
              }
              placeholder="Description"
            />

            <button type="button" onClick={handleAddStream}>
              + Add Stream
            </button>
          </div>

          <div className="academic-streams__list">
            {streams.map((stream) => {
              const assignedLevels = streamLevels
                .filter(
                  (streamLevel) =>
                    streamLevel.streamId === stream.id &&
                    streamLevel.isActive
                )
                .map(
                  (streamLevel) => streamLevel.academicLevelId
                );

              return (
                <div
                  key={stream.id}
                  className="academic-streams__item"
                >
                  <div>
                    <strong>{stream.name}</strong>
                    <span>{stream.code}</span>

                    {stream.description && (
                      <small>{stream.description}</small>
                    )}

                    <small>
                      {assignedLevels.length} academic level
                      {assignedLevels.length !== 1 ? "s" : ""}
                    </small>
                  </div>

                  <div className="academic-streams__actions">
                    <button
                      type="button"
                      className="assign"
                      onClick={() =>
                        setStreamLevelDialog({
                          open: true,
                          stream,
                          selectedLevels: assignedLevels,
                        })
                      }
                    >
                      Assign Levels
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


                {/* Subject Combinations */}
        <div className="academic-combinations">
          <h2>Subject Combinations</h2>
          <p>
            Create subject combinations for senior secondary streams.
            Subjects can be assigned to each combination after it is created.
          </p>

          <div className="academic-combinations__form">
            <select
              value={newCombinationLevelId}
              onChange={(e) =>
                setNewCombinationLevelId(e.target.value)
              }
            >
              <option value="">Select Academic Level</option>

              {academicLevels
                .filter(
                  (level) =>
                    level.category === "Senior Secondary"
                )
                .map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
            </select>

            <select
              value={newCombinationStreamId}
              onChange={(e) =>
                setNewCombinationStreamId(e.target.value)
              }
            >
              <option value="">Select Stream</option>

              {streams
                .filter((stream) =>
                  streamLevels.some(
                    (streamLevel) =>
                      streamLevel.streamId === stream.id &&
                      streamLevel.academicLevelId ===
                        Number(newCombinationLevelId) &&
                      streamLevel.isActive
                  )
                )
                .map((stream) => (
                  <option key={stream.id} value={stream.id}>
                    {stream.name}
                  </option>
                ))}
            </select>

            <input
              type="text"
              value={newCombinationName}
              onChange={(e) =>
                setNewCombinationName(e.target.value)
              }
              placeholder="Combination name e.g. Science Combination A"
            />

            <input
              type="text"
              value={newCombinationCode}
              onChange={(e) =>
                setNewCombinationCode(e.target.value)
              }
              placeholder="Combination code e.g. SCI-A"
            />

            <button
              type="button"
              onClick={handleAddCombination}
            >
              + Add Combination
            </button>
          </div>

          <div className="academic-combinations__list">
            {subjectCombinations.map((combination) => {
              const level = academicLevels.find(
                (item) =>
                  item.id === combination.academicLevelId
              );

              const stream = streams.find(
                (item) => item.id === combination.streamId
              );

              const combinationSubjects = combination.subjectIds
                .map((subjectId) =>
                  subjects.find(
                    (subject) => subject.id === subjectId
                  )
                )
                .filter(Boolean);

              return (
                <div
                  key={combination.id}
                  className="academic-combinations__item"
                >
                  <div>
                    <strong>{combination.name}</strong>

                    <span>
                      {level?.name} · {stream?.name}
                    </span>

                    <small>{combination.code}</small>

                    <small>
                      {combinationSubjects.length} subject
                      {combinationSubjects.length !== 1
                        ? "s"
                        : ""}
                    </small>
                  </div>

                  <div className="academic-combinations__subjects">
                    {combinationSubjects.map((subject) => (
                      <span key={subject.id}>
                        {subject.name}
                      </span>
                    ))}
                  </div>

                  <div className="academic-combinations__actions">
                    <button
                      type="button"
                      className="assign"
                      onClick={() =>
                        setCombinationSubjectDialog({
                          open: true,
                          combination,
                          selectedSubjects:
                            combination.subjectIds,
                        })
                      }
                    >
                      Assign Subjects
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


            {/* Subjects */}
        <div className="academic-subjects">
          <h2>Subjects</h2>

          <div className="academic-subjects__form">
            <input
              type="text"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="Subject name e.g. Mathematics"
            />

            <input
              type="text"
              value={newSubjectCode}
              onChange={(e) => setNewSubjectCode(e.target.value)}
              placeholder="Subject code e.g. MATH"
            />

            <select
              value={newSubjectCategory}
              onChange={(e) => setNewSubjectCategory(e.target.value)}
            >
              <option value="">Select category</option>
              <option value="Core">Core</option>
              <option value="Science">Science</option>
              <option value="Art">Art</option>
              <option value="Commercial">Commercial</option>
              <option value="Humanities">Humanities</option>
              <option value="Language">Language</option>
              <option value="Vocational">Vocational</option>
              <option value="Other">Other</option>
            </select>

            <label className="academic-subjects__core">
              <input
                type="checkbox"
                checked={newSubjectIsCore}
                onChange={(e) => setNewSubjectIsCore(e.target.checked)}
              />

                  Core subject
           </label>

            <button type="button" onClick={handleAddSubject}>
              + Add Subject
            </button>
          </div>

          <div className="academic-subjects__list">
            {subjects.map((subject) => (
              <div key={subject.id} className="academic-subjects__item">
                <div>
                  <strong>{subject.name}</strong>
                  <span>{subject.code}</span>
                  <small>{subject.category}</small>
                </div>

                <div className="academic-subjects__actions">

                  <button
                    type="button"
                    className="assign"
                    onClick={() =>
                      setSubjectLevelDialog({
                        open: true,
                        subject,
                        selectedLevels: subject.academicLevelIds || [],
                      })
                    }
               >
                     Assign Levels
               </button>


                  <button
                    type="button"
                    className="edit"
                    onClick={() => openEditDialog("subject", subject, subject.name)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete"
                    onClick={() => requestDeleteSubject(subject)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>




          {/* Result Settings */}
        <div className="academic-result-settings">
          <h2>Result Settings</h2>
          <p>
            Configure how student results are calculated and displayed.
          </p>

          {/* Assessment Structure */}
          <div className="academic-assessment">
            <h3>Assessment Structure</h3>
            <p>
              Define the maximum marks for each assessment component.
            </p>

            <div className="academic-assessment__form">
              <div>
                <label htmlFor="caMarks">CAT</label>
                <input
                  id="caMarks"
                  type="number"
                  min="0"
                  max="100"
                  value={caMax}
                  onChange={(e) => setCaMax(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="examMarks">Exam</label>
                <input
                  id="examMarks"
                  type="number"
                  min="0"
                  max="100"
                  value={examMax}
                  onChange={(e) => setExamMax(e.target.value)}
                />
              </div>

              <div className="academic-assessment__total">
                <span>Total</span>
                <strong>{Number(caMax || 0) + Number(examMax || 0)}</strong>
              </div>
            </div>
          </div>


            {/* Grading System */}
          <div className="academic-grading">
            <h3>Grading System</h3>
            <p>
              Define the score ranges, grades, and remarks used for student results.
            </p>


            <div className="academic-grading__form">
              <input
                type="number"
                min="0"
                max="100"
                value={newGradeMin}
                onChange={(e) => setNewGradeMin(e.target.value)}
                placeholder="Min score"
              />

              <input
                type="number"
                min="0"
                max="100"
                value={newGradeMax}
                onChange={(e) => setNewGradeMax(e.target.value)}
                placeholder="Max score"
              />

              <input
                type="text"
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                placeholder="Grade e.g. A1"
              />

              <input
                type="text"
                value={newGradeRemark}
                onChange={(e) => setNewGradeRemark(e.target.value)}
                placeholder="Remark e.g. Excellent"
              />

              <button
                type="button"
                onClick={handleAddGrade}
              >
                + Add Grade
              </button>
            </div>


           <div className="academic-grading__list">
                {gradingScale.map((grading) => (
                  <div
                    key={grading.id}
                    className="academic-grading__item"
                  >
                    <div className="academic-grading__details">
                      <span>{grading.min}</span>
                      <span>{grading.max}</span>
                      <strong>{grading.grade}</strong>
                      <span>{grading.remark}</span>
                    </div>

                    <div className="academic-grading__actions">
                      <button
                        type="button"
                        className="edit"
                        onClick={() => setGradeToEdit(grading)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete"
                        onClick={() => requestDeleteGrade(grading)}
                      >
                        Delete
                      </button>
                    </div>
                 </div>
                ))}
            </div>
          </div>


          {gradeToEdit && (
              <div className="academic-grading__edit">
                <h4>Edit Grading Rule</h4>

                <div className="academic-grading__form">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradeToEdit.min}
                    onChange={(e) =>
                      setGradeToEdit((prev) => ({
                        ...prev,
                        min: e.target.value,
                      }))
                    }
                    placeholder="Min score"
                  />

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradeToEdit.max}
                    onChange={(e) =>
                      setGradeToEdit((prev) => ({
                        ...prev,
                        max: e.target.value,
                      }))
                    }
                    placeholder="Max score"
                  />

                  <input
                    type="text"
                    value={gradeToEdit.grade}
                    onChange={(e) =>
                      setGradeToEdit((prev) => ({
                        ...prev,
                        grade: e.target.value,
                      }))
                    }
                    placeholder="Grade"
                  />

                  <input
                    type="text"
                    value={gradeToEdit.remark}
                    onChange={(e) =>
                      setGradeToEdit((prev) => ({
                        ...prev,
                        remark: e.target.value,
                      }))
                    }
                    placeholder="Remark"
                  />

                  <button
                    type="button"
                    onClick={handleUpdateGrade}
                  >
                    Save Changes
                  </button>

                  <button
                    type="button"
                    onClick={() => setGradeToEdit(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
          )}      


        </div>




        {/* Classes */}
        <div className="academic-classes">
          <h2>Classes</h2>

          <div className="academic-classes__form">
            <select
              value={selectedClassLevel}
              onChange={(e) =>
                setSelectedClassLevel(e.target.value)
              }
            >
              <option value="">
                Select academic level
              </option>

              {academicLevels
                .filter((level) =>
                  activeAcademicLevels.includes(level.id)
                )
                .map((level) => (
                  <option
                    key={level.id}
                    value={level.id}
                  >
                    {level.name}
                  </option>
                ))}
            </select>

            <input
              type="text"
              value={newClassName}
              onChange={(e) =>
                setNewClassName(e.target.value)
              }
              placeholder="Class name"
            />

            <button
              type="button"
              onClick={handleAddClass}
            >
              + Add Class
            </button>
          </div>

          <div className="academic-classes__list">
            {classes.map((classItem) => {
              const level = getLevelById(
                classItem.academicLevelId
              );

              return (
                <div
                  key={classItem.id}
                  className="academic-classes__item"
                >
                  <span>{level?.name}</span>

                  <strong>{classItem.name}</strong>

                  <div className="academic-classes__actions">
                    <button
                      type="button"
                      className="edit"
                      onClick={() =>
                        handleEditClass(classItem)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete"
                      onClick={() =>
                        requestDeleteClass(classItem)
                      }
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
            <select
              value={selectedClassId}
              onChange={(e) =>
                setSelectedClassId(Number(e.target.value))
              }
            >
              <option value="">Select class</option>

              {classes.map((classItem) => (
                <option
                  key={classItem.id}
                  value={classItem.id}
                >
                  {getClassLabel(classItem)}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={newSectionName}
              onChange={(e) =>
                setNewSectionName(e.target.value)
              }
              placeholder="Section name e.g. A"
            />

            <button
              type="button"
              onClick={handleAddSection}
            >
              + Add Section
            </button>
          </div>

          <div className="academic-sections__list">
            {classes.map((classItem) => {
              const level = getLevelById(
                classItem.academicLevelId
              );

              const classSections = sections.filter(
                (section) =>
                  section.classId === classItem.id
              );

              if (classSections.length === 0) {
                return null;
              }

              return (
                <div
                  key={classItem.id}
                  className="academic-sections__class"
                >
                  <h3>
                    {level?.name} — {classItem.name}
                  </h3>

                  <div className="academic-sections__items">
                    {classSections.map((section) => (
                      <div
                        key={section.id}
                        className="academic-sections__item"
                      >
                        <span>
                          {level?.name} {section.name}
                        </span>

                        <div className="academic-sections__actions">
                          <button
                            type="button"
                            className="edit"
                            onClick={() =>
                              openEditDialog(
                                "section",
                                section,
                                section.name
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete"
                            onClick={() =>
                              requestDeleteSection(section)
                            }
                          >
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

        {/* Category Level Checkboxes */}
        {[
          "Early Years",
          "Kindergarten",
          "Primary",
          "Junior Secondary",
          "Senior Secondary",
        ].map((category) => {
          const categoryLevels = academicLevels.filter(
            (level) => level.category === category
          );

          return (
            <section
              key={category}
              className="academic-setup__category"
            >
              <h2>{category}</h2>

              <div className="academic-setup__levels">
                {categoryLevels.map((level) => (
                  <div
                    key={level.id}
                    className="academic-setup__level"
                  >
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedLevels.includes(
                          level.id
                        )}
                        onChange={() =>
                          handleToggle(level.id)
                        }
                      />

                      <span>{level.name}</span>
                    </label>

                    <div className="academic-level__actions">
                      <button
                        type="button"
                        className="edit"
                        onClick={() =>
                          openEditDialog(
                            "level",
                            level,
                            level.name
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete"
                        onClick={() =>
                          requestDeleteLevel(level)
                        }
                      >
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
        <NotificationDialog
          title={notification.title}
          message={notification.message}
          onClose={() =>
            setShowNotification(false)
          }
        />
      )}

      {/* Delete Section */}
      {sectionToDelete && (
        <ConfirmDialog
          title="Delete Section"
          message={`Are you sure you want to delete section ${sectionToDelete.name}?`}
          onCancel={() =>
            setSectionToDelete(null)
          }
          onConfirm={() => {
            setSections((prev) =>
              prev.filter(
                (section) =>
                  section.id !== sectionToDelete.id
              )
            );

            setSectionToDelete(null);
          }}
        />
      )}

      {/* Delete Class */}
      {classToDelete && (
        <ConfirmDialog
          title="Delete Class"
          message={`Are you sure you want to delete ${getClassLabel(classToDelete)}?`}
          onCancel={() =>
            setClassToDelete(null)
          }
          onConfirm={() => {
            setClasses((prev) =>
              prev.filter(
                (classItem) =>
                  classItem.id !== classToDelete.id
              )
            );

            setSections((prev) =>
              prev.filter(
                (section) =>
                  section.classId !== classToDelete.id
              )
            );

            setClassToDelete(null);
          }}
        />
      )}

      {/* Delete Session */}
      {sessionToDelete && (
        <ConfirmDialog
          title="Delete Session"
          message={`Are you sure you want to delete session ${sessionToDelete.name}?`}
          onCancel={() =>
            setSessionToDelete(null)
          }
          onConfirm={() => {
            setAcademicSessions((prev) =>
              prev.filter(
                (session) =>
                  session.id !== sessionToDelete.id
              )
            );

            setAcademicTerms((prev) =>
              prev.filter(
                (term) =>
                  term.academicSessionId !==
                  sessionToDelete.id
              )
            );

            setSessionToDelete(null);
          }}
        />
      )}

          {/* Delete Term */}
          {termToDelete && (
            <ConfirmDialog
              title="Delete Term"
              message={`Are you sure you want to delete ${termToDelete.name}?`}
              onCancel={() =>
                setTermToDelete(null)
              }
              onConfirm={() => {
                setAcademicTerms((prev) =>
                  prev.filter(
                    (term) =>
                      term.id !== termToDelete.id
                  )
                );

                setTermToDelete(null);
              }}
            />
          )}


          {subjectToDelete && (
              <ConfirmDialog
                title="Delete Subject"
                message={`Are you sure you want to delete ${subjectToDelete.name}?`}
                onCancel={() => setSubjectToDelete(null)}
                onConfirm={() => {
                  setSubjects((prev) =>
                    prev.filter((subject) => subject.id !== subjectToDelete.id)
                  );

                  setSubjectToDelete(null);
                }}
            />
          )}


          {gradeToDelete && (
            <ConfirmDialog
              title="Delete Grade"
              message={`Are you sure you want to delete the ${gradeToDelete.grade} grading rule?`}
              onConfirm={() => {
                setGradingScale((prev) =>
                  prev.filter((grading) => grading.id !== gradeToDelete.id)
                );

                setGradeToDelete(null);

                notify({
                  title: "Grade Deleted",
                  message: "The grading rule has been deleted successfully.",
                });
              }}
              onCancel={() => setGradeToDelete(null)}
            />
          )}


      {/* Delete Academic Level */}
      {levelToDelete && (
        <ConfirmDialog
          title="Delete Level"
          message={`Are you sure you want to delete level ${levelToDelete.name}? This will remove related classes.`}
          onCancel={() =>
            setLevelToDelete(null)
          }
          onConfirm={() => {
            setAcademicLevels((prev) =>
              prev.filter(
                (level) =>
                  level.id !== levelToDelete.id
              )
            );

            setActiveAcademicLevels((prev) =>
              prev.filter(
                (id) => id !== levelToDelete.id
              )
            );

            const removedClassIds = classes
              .filter(
                (classItem) =>
                  classItem.academicLevelId ===
                  levelToDelete.id
              )
              .map((classItem) => classItem.id);

            setClasses((prev) =>
              prev.filter(
                (classItem) =>
                  classItem.academicLevelId !==
                  levelToDelete.id
              )
            );

            setSections((prev) =>
              prev.filter(
                (section) =>
                  !removedClassIds.includes(
                    section.classId
                  )
              )
            );

            setLevelToDelete(null);
          }}
        />
      )}

      {/* Edit Dialog */}
      {editDialog.open && (
        <div className="edit-modal">
          <div className="edit-modal__content">
            <h3>
              Edit {editDialog.type}
            </h3>

            <input
              value={editDialog.value}
              onChange={(e) =>
                setEditDialog((dialog) => ({
                  ...dialog,
                  value: e.target.value,
                }))
              }
            />

            <div className="edit-modal__actions">
              <button
                type="button"
                onClick={handleEditSave}
              >
                Save
              </button>

              <button
                type="button"
                onClick={closeEditDialog}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}



                {/* Stream Level Assignment Dialog */}
          {streamLevelDialog.open && (
            <div className="edit-modal">
              <div className="edit-modal__content">
                <h3>
                  Assign Levels — {streamLevelDialog.stream?.name}
                </h3>

                <p>
                  Select the academic levels where this stream is offered.
                </p>

                <div className="subject-levels">
                  {academicLevels
                    .filter(
                      (level) =>
                        level.category === "Senior Secondary"
                    )
                    .map((level) => (
                      <label
                        key={level.id}
                        className="subject-levels__item"
                      >
                        <input
                          type="checkbox"
                          checked={streamLevelDialog.selectedLevels.includes(
                            level.id
                          )}
                          onChange={() => {
                            setStreamLevelDialog((prev) => ({
                              ...prev,
                              selectedLevels:
                                prev.selectedLevels.includes(level.id)
                                  ? prev.selectedLevels.filter(
                                      (id) => id !== level.id
                                    )
                                  : [
                                      ...prev.selectedLevels,
                                      level.id,
                                    ],
                            }));
                          }}
                        />

                        <span>{level.name}</span>
                      </label>
                    ))}
                </div>

                <div className="edit-modal__actions">
                  <button
                    type="button"
                    onClick={() =>
                      setStreamLevelDialog({
                        open: false,
                        stream: null,
                        selectedLevels: [],
                      })
                    }
                  >
                    Cancel
                  </button>

                                    <button
                    type="button"
                    onClick={() => {
                      const {
                        stream,
                        selectedLevels,
                      } = streamLevelDialog;

                      const existingForStream =
                        streamLevels.filter(
                          (item) =>
                            item.streamId === stream.id
                        );

                      const nextStreamLevels =
                        streamLevels.filter(
                          (item) =>
                            item.streamId !== stream.id
                        );

                      const usedIds = streamLevels.map(
                        (item) => item.id
                      );

                      let nextId =
                        usedIds.length > 0
                          ? Math.max(...usedIds) + 1
                          : 1;

                      const newAssignments =
                        selectedLevels.map(
                          (academicLevelId) => {
                            const existing =
                              existingForStream.find(
                                (item) =>
                                  item.academicLevelId ===
                                  academicLevelId
                              );

                            if (existing) {
                              return existing;
                            }

                            const assignment = {
                              id: nextId,
                              academicLevelId,
                              streamId: stream.id,
                              isActive: true,
                            };

                            nextId += 1;

                            return assignment;
                          }
                        );

                      setStreamLevels([
                        ...nextStreamLevels,
                        ...newAssignments,
                      ]);

                      setStreamLevelDialog({
                        open: false,
                        stream: null,
                        selectedLevels: [],
                      });

                      notify({
                        title: "Levels Saved",
                        message: `${stream.name} has been assigned to the selected academic levels.`,
                      });
                    }}
                  >
                    Save Levels
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Combination Subject Assignment Dialog */}
{combinationSubjectDialog.open && (
  <div className="edit-modal">
    <div className="edit-modal__content">
      <h3>
        Assign Subjects —{" "}
        {combinationSubjectDialog.combination?.name}
      </h3>

      <p>
        Select the subjects that belong to this
        combination. Only subjects available for the
        combination's academic level are shown.
      </p>

      <div className="subject-levels">
        {subjects
          .filter((subject) =>
            subject.academicLevelIds?.includes(
              combinationSubjectDialog.combination
                ?.academicLevelId
            )
          )
          .map((subject) => (
            <label
              key={subject.id}
              className="subject-levels__item"
            >
              <input
                type="checkbox"
                checked={combinationSubjectDialog.selectedSubjects.includes(
                  subject.id
                )}
                onChange={() => {
                  setCombinationSubjectDialog((prev) => ({
                    ...prev,
                    selectedSubjects:
                      prev.selectedSubjects.includes(
                        subject.id
                      )
                        ? prev.selectedSubjects.filter(
                            (id) => id !== subject.id
                          )
                        : [
                            ...prev.selectedSubjects,
                            subject.id,
                          ],
                  }));
                }}
              />

              <span>
                {subject.name} ({subject.code})
              </span>
            </label>
          ))}
      </div>

      <div className="edit-modal__actions">
        <button
          type="button"
          onClick={() =>
            setCombinationSubjectDialog({
              open: false,
              combination: null,
              selectedSubjects: [],
            })
          }
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => {
            const {
              combination,
              selectedSubjects,
            } = combinationSubjectDialog;

            if (!combination) return;

            const validSubjectIds = selectedSubjects.filter(
              (subjectId) => {
                const subject = subjects.find(
                  (item) => item.id === subjectId
                );

                return subject?.academicLevelIds?.includes(
                  combination.academicLevelId
                );
              }
            );

            setSubjectCombinations((prev) =>
              prev.map((item) =>
                item.id === combination.id
                  ? {
                      ...item,
                      subjectIds: validSubjectIds,
                    }
                  : item
              )
            );

            setCombinationSubjectDialog({
              open: false,
              combination: null,
              selectedSubjects: [],
            });

            notify({
              title: "Subjects Saved",
              message: `Subjects for ${combination.name} have been updated successfully.`,
            });
          }}
        >
          Save Subjects
        </button>
      </div>
    </div>
  </div>
)}


          {/* Subject Level Assignment Dialog */}
          {subjectLevelDialog.open && (
            <div className="edit-modal">
              <div className="edit-modal__content">
                <h3>
                  Assign Levels — {subjectLevelDialog.subject?.name}
                </h3>

                <div className="subject-levels">
                  {academicLevels.map((level) => (
                    <label key={level.id} className="subject-levels__item">
                      <input
                        type="checkbox"
                        checked={subjectLevelDialog.selectedLevels.includes(level.id)}
                        onChange={() => {
                          setSubjectLevelDialog((prev) => ({
                            ...prev,
                            selectedLevels: prev.selectedLevels.includes(level.id)
                              ? prev.selectedLevels.filter((id) => id !== level.id)
                              : [...prev.selectedLevels, level.id],
                          }));
                        }}
                      />

                      <span>{level.name}</span>
                    </label>
                  ))}
                </div>

                <div className="edit-modal__actions">
                  <button
                    type="button"
                    onClick={() =>
                      setSubjectLevelDialog({
                        open: false,
                        subject: null,
                        selectedLevels: [],
                      })
                    }
                  >
                    Cancel
                  </button>
                    <button
                          type="button"
                          onClick={() => {
                            const { subject, selectedLevels } = subjectLevelDialog;

                            setSubjects((prev) =>
                              prev.map((item) =>
                                item.id === subject.id
                                  ? {
                                      ...item,
                                      academicLevelIds: selectedLevels,
                                    }
                                  : item
                              )
                            );

                            setSubjectLevelDialog({
                              open: false,
                              subject: null,
                              selectedLevels: [],
                            });

                            notify({
                              title: "Levels Saved",
                              message: `${subject.name} has been assigned to the selected academic levels.`,
                            });
                          }}
                    >
                              Save Levels
                  </button>
                </div>
              </div>
            </div>
          )}

    </div>
  );
};

export default AcademicSetup;