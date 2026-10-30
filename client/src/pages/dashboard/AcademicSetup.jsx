import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useOutletContext } from "react-router-dom";
import NotificationDialog from "../../components/common/NotificationDialog/NotificationDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";

import "./AcademicSetup.css";

function generateId(items) {
  if (!items || items.length === 0) return 1;

  return Math.max(...items.map((item) => item.id)) + 1;
}

const AcademicSetup = () => {

  const { authToken } = useAuth();
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
  const [selectedClassSession, setSelectedClassSession] = useState("");
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
  const [newSubjectAcademicLevelIds, setNewSubjectAcademicLevelIds] =
  useState([]);

  const [newSessionStartDate, setNewSessionStartDate] = useState("");
  const [newSessionEndDate, setNewSessionEndDate] = useState("");
  const [newSessionIsCurrent, setNewSessionIsCurrent] = useState(false);

  const [newTermStartDate, setNewTermStartDate] = useState("");
  const [newTermEndDate, setNewTermEndDate] = useState("");
  const [newTermIsCurrent, setNewTermIsCurrent] = useState(false);


  // Assessment structure — loaded from the database
  const [caMax, setCaMax] = useState(30);
  const [examMax, setExamMax] = useState(70);

  // Grading rules — loaded from the database
  const [gradingScale, setGradingScale] = useState([]);


  const [resultSettingsLoading, setResultSettingsLoading] = useState(true);
  const [resultSettingsLoaded, setResultSettingsLoaded] = useState(false);
  const [assessmentSettingsSaving, setAssessmentSettingsSaving] = useState(false);

  // Load the school's assessment and grading settings
  useEffect(() => {
    let cancelled = false;

    const loadResultSettings = async () => {
      setResultSettingsLoading(true);
      setResultSettingsLoaded(false);

      try {
        const data = await apiRequest("/result-settings");

        if (cancelled) return;

        setCaMax(Number(data.assessmentSettings.caMax));
        setExamMax(Number(data.assessmentSettings.examMax));
        setGradingScale(data.gradingScale);
        setResultSettingsLoaded(true);
      } catch (error) {
        if (cancelled) return;

        notify({
          title: "Unable to Load Result Settings",
          message: error.message,
        });
      } finally {
        if (!cancelled) {
          setResultSettingsLoading(false);
        }
      }
    };

    loadResultSettings();

    return () => {
      cancelled = true;
    };
  }, [authToken]);





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
  const handleAddLevel = async () => {
    const name = newLevelName.trim();
    const category = newLevelCategory;

    if (!name || !category) {
      notify({
        title: "Missing fields",
        message: "Please enter level name and category.",
      });
      return;
    }

    const displayOrder =
      Math.max(
        0,
        ...academicLevels.map(
          (level) => Number(level.displayOrder) || 0
        )
      ) + 1;

    try {
      const data = await apiRequest("/academic-levels", {
        method: "POST",
        body: JSON.stringify({
          name,
          category,
          displayOrder,
        }),
      });

      const level = data.level;

      setAcademicLevels((prev) => [
        ...prev,
        {
          id: level.id,
          name: level.name,
          category: level.category,
          displayOrder: level.display_order,
        },
      ]);

      setNewLevelName("");
      setNewLevelCategory("");

      notify({
        title: "Level Created",
        message: `${level.name} was saved successfully.`,
      });
    } catch (error) {
      notify({
        title: "Unable to Create Level",
        message: error.message,
      });
    }
  };


    // Add Academic Session
  const handleAddSession = async () => {
    const name = newSessionName.trim();

    if (!name || !newSessionStartDate || !newSessionEndDate) {
      notify({
        title: "Missing fields",
        message: "Enter the session name, start date, and end date.",
      });
      return;
    }

    if (newSessionEndDate < newSessionStartDate) {
      notify({
        title: "Invalid Dates",
        message: "The end date cannot be earlier than the start date.",
      });
      return;
    }

    try {
      const data = await apiRequest("/academic-sessions", {
        method: "POST",
        body: JSON.stringify({
          name,
          startDate: newSessionStartDate,
          endDate: newSessionEndDate,
          isCurrent: newSessionIsCurrent,
        }),
      });

      const session = data.session;

      const newSession = {
        id: session.id,
        name: session.name,
        startDate: session.start_date,
        endDate: session.end_date,
        isCurrent: session.is_current,
      };

      setAcademicSessions((prev) => [
        ...prev.map((item) =>
          newSession.isCurrent
            ? { ...item, isCurrent: false }
            : item
        ),
        newSession,
      ]);

      setNewSessionName("");
      setNewSessionStartDate("");
      setNewSessionEndDate("");
      setNewSessionIsCurrent(false);

      notify({
        title: "Session Created",
        message: `${session.name} was saved successfully.`,
      });
    } catch (error) {
      notify({
        title: "Unable to Create Session",
        message: error.message,
      });
    }
  };

    // Add Academic Term
  const handleAddTerm = async () => {
    if (!selectedTermSession) {
      notify({
        title: "Select Session",
        message: "Please select an academic session.",
      });
      return;
    }

    const name = newTermName.trim();

    if (!name || !newTermStartDate || !newTermEndDate) {
      notify({
        title: "Missing fields",
        message: "Enter the term name, start date, and end date.",
      });
      return;
    }

    if (newTermEndDate < newTermStartDate) {
      notify({
        title: "Invalid Dates",
        message: "The end date cannot be earlier than the start date.",
      });
      return;
    }

    const alreadyExists = academicTerms.some(
      (term) =>
        term.academicSessionId === selectedTermSession &&
        term.name.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      notify({
        title: "Term Already Exists",
        message: `${name} already exists for this academic session.`,
      });
      return;
    }

    const displayOrder =
      Math.max(
        0,
        ...academicTerms
          .filter(
            (term) =>
              term.academicSessionId === selectedTermSession
          )
          .map((term) => Number(term.displayOrder) || 0)
      ) + 1;

    try {
      const data = await apiRequest("/terms", {
        method: "POST",
        body: JSON.stringify({
          academicSessionId: selectedTermSession,
          name,
          displayOrder,
          startDate: newTermStartDate,
          endDate: newTermEndDate,
          isCurrent: newTermIsCurrent,
        }),
      });

      const term = data.term;

      setAcademicTerms((prev) => [
        ...prev,
        {
          id: term.id,
          academicSessionId: term.academic_session_id,
          academicSessionName:
            academicSessions.find(
              (session) => session.id === term.academic_session_id
            )?.name || "",
          name: term.name,
          displayOrder: term.display_order,
          startDate: term.start_date,
          endDate: term.end_date,
          isCurrent: term.is_current,
        },
      ]);

      setNewTermName("");
      setNewTermStartDate("");
      setNewTermEndDate("");
      setNewTermIsCurrent(false);

      notify({
        title: "Term Created",
        message: `${term.name} was saved successfully.`,
      });
    } catch (error) {
      notify({
        title: "Unable to Create Term",
        message: error.message,
      });
    }
  };


    // Add Stream
  const handleAddStream = async () => {
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

    try {
      const data = await apiRequest("/streams", {
        method: "POST",
        body: JSON.stringify({ name, code, description, isActive: true }),
      });

      const savedStream = data.stream;
      setStreams((prev) => [
        ...prev,
        {
          id: savedStream.id,
          name: savedStream.name,
          code: savedStream.code,
          description: savedStream.description ?? "",
          isActive: savedStream.is_active,
          academicLevelIds: data.academicLevelIds ?? [],
          academicLevels: savedStream.academic_levels ?? [],
        },
      ]);

      setNewStreamName("");
      setNewStreamCode("");
      setNewStreamDescription("");

      notify({
        title: "Stream Added",
        message: name + " has been added successfully.",
      });
    } catch (error) {
      notify({
        title: "Unable to Create Stream",
        message: error.message,
      });
    }
  };


  const handleAddCombination = async () => {
    const academicLevelId = newCombinationLevelId;
    const streamId = newCombinationStreamId;
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

    try {
      const data = await apiRequest("/subject-combinations", {
        method: "POST",
        body: JSON.stringify({
          academicLevelId,
          streamId,
          name,
          code,
          isActive: true,
          subjectIds: [],
        }),
      });

      const saved = data.subjectCombination;
      const savedSubjectIds = data.subjectIds ?? [];

      setSubjectCombinations((prev) => [
        ...prev,
        {
          id: saved.id,
          academicLevelId: saved.academic_level_id,
          streamId: saved.stream_id,
          name: saved.name,
          code: saved.code,
          isActive: saved.is_active,
          subjectIds: savedSubjectIds,
          subjects: [],
        },
      ]);

      setNewCombinationLevelId("");
      setNewCombinationStreamId("");
      setNewCombinationName("");
      setNewCombinationCode("");

      notify({
        title: "Combination Added",
        message: name + " has been added successfully.",
      });
    } catch (error) {
      notify({
        title: "Unable to Create Combination",
        message: error.message,
      });
    }
  };


const handleAddSubject = async () => {
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

  if (newSubjectAcademicLevelIds.length === 0) {
    notify({
      title: "Select Academic Levels",
      message: "Assign the subject to at least one academic level.",
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
      title: "Subject Exists",
      message: "A subject with this name or code already exists.",
    });
    return;
  }

  try {
    const data = await apiRequest("/subjects", {
      method: "POST",
      body: JSON.stringify({
        name,
        code,
        category,
        isCore: newSubjectIsCore,
        academicLevelIds: newSubjectAcademicLevelIds,
      }),
    });

    const saved = data.subject;

    if (!saved?.id) {
      throw new Error("The server did not return the saved subject.");
    }

    setSubjects((prev) => [
      ...prev,
      {
        id: saved.id,
        name: saved.name,
        code: saved.code,
        category: saved.category,
        isCore: saved.is_core ?? saved.isCore,
        academicLevelIds:
          saved.academicLevelIds ??
          saved.academic_level_ids ??
          newSubjectAcademicLevelIds,
      },
    ]);

    setNewSubjectName("");
    setNewSubjectCode("");
    setNewSubjectCategory("");
    setNewSubjectIsCore(true);
    setNewSubjectAcademicLevelIds([]);

    notify({
      title: "Subject Added",
      message: `${saved.name} has been added successfully.`,
    });
  } catch (error) {
    notify({
      title: "Unable to Add Subject",
      message: error.message,
    });
  }
};



         // Add Class
    const handleAddClass = async () => {
      if (!selectedClassSession) {
        notify({
          title: "Select session",
          message: "Please select an academic session.",
        });
        return;
      }

      if (!selectedClassLevel) {
        notify({
          title: "Select level",
          message: "Please select an academic level.",
        });
        return;
      }

      const session = academicSessions.find(
        (item) => item.id === selectedClassSession
      );

      const level = academicLevels.find(
        (item) => item.id === selectedClassLevel
      );

      if (!session || !level) {
        notify({
          title: "Invalid selection",
          message: "The selected academic session or level could not be found.",
        });
        return;
      }

      const className = newClassName.trim() || level.name;

      try {
        const data = await apiRequest("/classes", {
          method: "POST",
          body: JSON.stringify({
            academicSessionId: selectedClassSession,
            academicLevelId: selectedClassLevel,
            name: className,
          }),
        });

        const createdClass = data.class;

        if (!createdClass?.id) {
          throw new Error("The server did not return the created class.");
        }

        setClasses((prev) => [
          ...prev,
          {
            id: createdClass.id,
            academicSessionId: createdClass.academic_session_id,
            academicLevelId: createdClass.academic_level_id,
            name: createdClass.name,
          },
        ]);

        setSelectedClassSession("");
        setSelectedClassLevel("");
        setNewClassName("");

        notify({
          title: "Class created",
          message: `${createdClass.name} was created successfully.`,
        });
      } catch (error) {
        notify({
          title: "Unable to create class",
          message: error.message || "Please try again.",
        });
      }
    };

      // Add Section
  const handleAddSection = async () => {
    if (!selectedClassId) {
      notify({
        title: "Select a Class",
        message: "Please select a class before adding a section.",
      });
      return;
    }

    const sectionName = newSectionName.trim();

    if (!sectionName) {
      notify({
        title: "Section Name Required",
        message: "Please enter a section name.",
      });
      return;
    }

    try {
      const data = await apiRequest("/sections", {
        method: "POST",
        body: JSON.stringify({
          classId: selectedClassId,
          name: sectionName,
        }),
      });

      const createdSection = data.section;

      if (!createdSection?.id) {
        throw new Error("The server did not return the created section.");
      }

      setSections((prev) => [
        ...prev,
        {
          id: createdSection.id,
          classId: createdSection.class_id,
          name: createdSection.name,
          classTeacherId: createdSection.class_teacher_id,
          room: createdSection.room ?? "",
          capacity: createdSection.capacity,
        },
      ]);

      setNewSectionName("");

      notify({
        title: "Section created",
        message: `Section ${createdSection.name} was created successfully.`,
      });
    } catch (error) {
      notify({
        title: "Unable to create section",
        message: error.message || "Please try again.",
      });
    }
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
  const handleEditSave = async () => {
    const value = editDialog.value.trim();

    if (!value) {
      notify({
        title: "Value Required",
        message: "Please enter a value before saving.",
      });
      return;
    }

    if (editDialog.type === "class") {
      try {
        const data = await apiRequest(
          `/classes/${editDialog.item.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ name: value }),
          }
        );

        const updatedClass = data.class;

        if (!updatedClass?.id) {
          throw new Error("The server did not return the updated class.");
        }

        setClasses((prev) =>
          prev.map((classItem) =>
            classItem.id === updatedClass.id
              ? {
                  ...classItem,
                  name: updatedClass.name,
                  academicSessionId: updatedClass.academic_session_id,
                  academicLevelId: updatedClass.academic_level_id,
                }
              : classItem
          )
        );

        notify({
          title: "Class updated",
          message: `${updatedClass.name} was updated successfully.`,
        });

        closeEditDialog();
      } catch (error) {
        notify({
          title: "Unable to update class",
          message: error.message || "Please try again.",
        });
      }

      return;
    }

    if (editDialog.type === "section") {
      try {
        const data = await apiRequest(
          `/sections/${editDialog.item.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ name: value }),
          }
        );

        const updatedSection = data.section;

        if (!updatedSection?.id) {
          throw new Error("The server did not return the updated section.");
        }

        setSections((prev) =>
          prev.map((section) =>
            section.id === updatedSection.id
              ? {
                  ...section,
                  classId: updatedSection.class_id,
                  name: updatedSection.name,
                  classTeacherId: updatedSection.class_teacher_id,
                  room: updatedSection.room ?? "",
                  capacity: updatedSection.capacity,
                }
              : section
          )
        );

        notify({
          title: "Section updated",
          message: `Section ${updatedSection.name} was updated successfully.`,
        });

        closeEditDialog();
      } catch (error) {
        notify({
          title: "Unable to update section",
          message: error.message || "Please try again.",
        });
      }

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
          term.academicSessionId === editDialog.item.academicSessionId &&
          term.name.toLowerCase() === value.toLowerCase()
      );

      if (exists) {
        notify({
          title: "Term Already Exists",
          message: `${value} already exists for this academic session.`,
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
    }else if (editDialog.type === "subject") {
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

    try {
      const data = await apiRequest(
        `/subjects/${editDialog.item.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ name: value }),
        }
      );

      const saved = data.subject;

      setSubjects((prev) =>
        prev.map((subject) =>
          subject.id === editDialog.item.id
            ? {
                ...subject,
                name: saved?.name ?? value,
              }
            : subject
        )
      );
    } catch (error) {
      notify({
        title: "Unable to Update Subject",
        message: error.message,
      });
      return;
    }
  }

    closeEditDialog();
  };

  // Edit class
  const handleEditClass = (classItem) => {
    openEditDialog("class", classItem, classItem.name);
  };


  // Save assessment structure
  const handleSaveAssessmentSettings = async () => {
    const ca = Number(caMax);
    const exam = Number(examMax);

    if (
      caMax === "" ||
      examMax === "" ||
      !Number.isFinite(ca) ||
      !Number.isFinite(exam) ||
      ca < 0 ||
      ca > 100 ||
      exam < 0 ||
      exam > 100 ||
      ca + exam !== 100
    ) {
      notify({
        title: "Invalid Assessment Structure",
        message: "CAT and Exam marks must be between 0 and 100 and total exactly 100.",
      });
      return;
    }

    setAssessmentSettingsSaving(true);

    try {
      const data = await apiRequest("/result-settings/assessment", {
        method: "PATCH",
        body: JSON.stringify({
          caMax: ca,
          examMax: exam,
        }),
      });

      setCaMax(data.assessmentSettings.caMax);
      setExamMax(data.assessmentSettings.examMax);

      notify({
        title: "Assessment Settings Saved",
        message: data.message,
      });
    } catch (error) {
      notify({
        title: "Unable to Save Assessment Settings",
        message: error.message,
      });
    } finally {
      setAssessmentSettingsSaving(false);
    }
  };


  // Add grade
  const handleAddGrade = async () => {
    const min = Number(newGradeMin);
    const max = Number(newGradeMax);
    const grade = newGrade.trim();
    const remark = newGradeRemark.trim();

    if (
      newGradeMin === "" ||
      newGradeMax === "" ||
      !grade ||
      !remark
    ) {
      notify({
        title: "Incomplete Grade",
        message: "Please fill in all grading fields.",
      });
      return;
    }

    if (
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      min < 0 ||
      max > 100 ||
      min > max
    ) {
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

    try {
      const data = await apiRequest("/result-settings/grading-scales", {
        method: "POST",
        body: JSON.stringify({ min, max, grade, remark }),
      });

      setGradingScale((prev) => [...prev, data.gradingRule]);

      setNewGradeMin("");
      setNewGradeMax("");
      setNewGrade("");
      setNewGradeRemark("");

      notify({
        title: "Grade Added",
        message: `${grade} grading rule has been saved successfully.`,
      });
    } catch (error) {
      notify({
        title: "Unable to Add Grade",
        message: error.message,
      });
    }
  };

  // Update grade
  const handleUpdateGrade = async () => {
    if (!gradeToEdit) {
      return;
    }

    const min = Number(gradeToEdit.min);
    const max = Number(gradeToEdit.max);
    const grade = gradeToEdit.grade.trim();
    const remark = gradeToEdit.remark.trim();

    if (
      gradeToEdit.min === "" ||
      gradeToEdit.max === "" ||
      !grade ||
      !remark
    ) {
      notify({
        title: "Incomplete Grade",
        message: "Please fill in all grading fields.",
      });
      return;
    }

    if (
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      min < 0 ||
      max > 100 ||
      min > max
    ) {
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

    try {
      const data = await apiRequest(
        `/result-settings/grading-scales/${gradeToEdit.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ min, max, grade, remark }),
        }
      );

      setGradingScale((prev) =>
        prev.map((gradingRule) =>
          gradingRule.id === data.gradingRule.id
            ? data.gradingRule
            : gradingRule
        )
      );

      setGradeToEdit(null);

      notify({
        title: "Grade Updated",
        message: "The grading rule has been saved successfully.",
      });
    } catch (error) {
      notify({
        title: "Unable to Update Grade",
        message: error.message,
      });
    }
  };

  // Delete requests


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


        {/* Academic Levels */}
        <div className="academic-levels">
          <h2>Academic Levels</h2>

          <div className="academic-levels__form">
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
              <option value="Early Childhood">Early Childhood</option>
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

          <div className="academic-levels__list">
            {academicLevels.map((level) => (
              <div
                key={level.id}
                className="academic-levels__item"
              >
                <span>{level.name}</span>

                <div className="academic-levels__actions">
                  <button
                    className="edit"
                    type="button"
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
                    className="delete"
                    type="button"
                    onClick={() => requestDeleteLevel(level)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
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

            <input
              type="date"
              value={newSessionStartDate}
              onChange={(e) => setNewSessionStartDate(e.target.value)}
              aria-label="Session start date"
            />

            <input
              type="date"
              value={newSessionEndDate}
              onChange={(e) => setNewSessionEndDate(e.target.value)}
              aria-label="Session end date"
            />

            <label>
              <input
                type="checkbox"
                checked={newSessionIsCurrent}
                onChange={(e) => setNewSessionIsCurrent(e.target.checked)}
              />
              Current session
            </label>

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


            <input
                type="date"
                value={newTermStartDate}
                onChange={(e) => setNewTermStartDate(e.target.value)}
                aria-label="Term start date"
              />

              <input
                type="date"
                value={newTermEndDate}
                onChange={(e) => setNewTermEndDate(e.target.value)}
                aria-label="Term end date"
              />

              <label>
                <input
                  type="checkbox"
                  checked={newTermIsCurrent}
                  onChange={(e) => setNewTermIsCurrent(e.target.checked)}
                />
                Current term
              </label>

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
                        newCombinationLevelId &&
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


          <div className="academic-subjects__levels">
            <span>Select academic levels (required)</span>

            {academicLevels.map((level) => (
              <label key={level.id}>
                <input
                  type="checkbox"
                  checked={newSubjectAcademicLevelIds.includes(level.id)}
                  onChange={(e) => {
                    setNewSubjectAcademicLevelIds((prev) =>
                      e.target.checked
                        ? [...prev, level.id]
                        : prev.filter((id) => id !== level.id)
                    );
                  }}
                />
                {level.name}
              </label>
            ))}
          </div>


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
                   disabled={!resultSettingsLoaded || assessmentSettingsSaving}
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
                   disabled={!resultSettingsLoaded || assessmentSettingsSaving}
                />
              </div>

              <div className="academic-assessment__total">
                <span>Total</span>
                <strong>{Number(caMax || 0) + Number(examMax || 0)}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveAssessmentSettings}
             disabled={!resultSettingsLoaded || assessmentSettingsSaving}
            >
              {assessmentSettingsSaving ? "Saving..." : "Save Assessment Structure"}
            </button>

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
                disabled={!resultSettingsLoaded}
                placeholder="Min score"
              />

              <input
                type="number"
                min="0"
                max="100"
                value={newGradeMax}
                onChange={(e) => setNewGradeMax(e.target.value)}
                disabled={!resultSettingsLoaded}
                placeholder="Max score"
              />

              <input
                type="text"
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                disabled={!resultSettingsLoaded}
                placeholder="Grade e.g. A1"
              />

              <input
                type="text"
                value={newGradeRemark}
                onChange={(e) => setNewGradeRemark(e.target.value)}
                disabled={!resultSettingsLoaded}
                placeholder="Remark e.g. Excellent"
              />

              <button
                type="button"
                onClick={handleAddGrade}
                 disabled={!resultSettingsLoaded}
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
                        disabled={!resultSettingsLoaded}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete"
                        onClick={() => requestDeleteGrade(grading)}
                        disabled={!resultSettingsLoaded}
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
                    disabled={!resultSettingsLoaded}
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
                    disabled={!resultSettingsLoaded}
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
                    disabled={!resultSettingsLoaded}
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
                    disabled={!resultSettingsLoaded}
                    placeholder="Remark"
                  />

                  <button
                    type="button"
                    onClick={handleUpdateGrade}
                    disabled={!resultSettingsLoaded}
                  >
                    Save Changes
                  </button>

                  <button
                    type="button"
                    onClick={() => setGradeToEdit(null)}
                    disabled={!resultSettingsLoaded}
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
                value={selectedClassSession}
                onChange={(e) => setSelectedClassSession(e.target.value)}
              >
                <option value="">Select academic session</option>

                {academicSessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
          </select>

            <select
              value={selectedClassLevel}
              onChange={(e) =>
                setSelectedClassLevel(e.target.value)
              }
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
                setSelectedClassId(e.target.value)
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
            {
              name: "Early Childhood",
              categories: ["Early Childhood", "Early Years"],
            },
            {
              name: "Kindergarten",
              categories: ["Kindergarten"],
            },
            {
              name: "Primary",
              categories: ["Primary"],
            },
            {
              name: "Junior Secondary",
              categories: ["Junior Secondary"],
            },
            {
              name: "Senior Secondary",
              categories: ["Senior Secondary"],
            },
          ].map(({ name, categories }) => {
            const categoryLevels = academicLevels.filter((level) =>
              categories.includes(level.category)
            );

            return (
              <section key={name} className="academic-setup__category">
                <h2>{name}</h2>

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
                          onClick={() =>
                            openEditDialog("level", level, level.name)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete"
                          onClick={() => requestDeleteLevel(level)}
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
            onConfirm={async () => {
            const sectionId = sectionToDelete.id;

            try {
              await apiRequest(`/sections/${sectionId}`, {
                method: "DELETE",
              });

              setSections((prev) =>
                prev.filter((section) => section.id !== sectionId)
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

      {/* Delete Class */}
      {classToDelete && (
        <ConfirmDialog
          title="Delete Class"
          message={`Are you sure you want to delete ${getClassLabel(classToDelete)}?`}
          onCancel={() =>
            setClassToDelete(null)
          }
          onConfirm={async () => {
              const classId = classToDelete.id;

              try {
                await apiRequest(`/classes/${classId}`, {
                  method: "DELETE",
                });

                setClasses((prev) =>
                  prev.filter((classItem) => classItem.id !== classId)
                );

                setClassToDelete(null);
                setSelectedClassId("");

                notify({
                  title: "Class deleted",
                  message: "The class was deleted successfully.",
                });
              } catch (error) {
                notify({
                  title: "Unable to delete class",
                  message: error.message || "Please try again.",
                });
              }
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
               onConfirm={async () => {
                  const subject = subjectToDelete;

                  if (!subject) return;

                  try {
                    await apiRequest(`/subjects/${subject.id}`, {
                      method: "DELETE",
                    });

                    setSubjects((prev) =>
                      prev.filter((item) => item.id !== subject.id)
                    );

                    setSubjectToDelete(null);

                    notify({
                      title: "Subject Deleted",
                      message: `${subject.name} has been deleted successfully.`,
                    });
                  } catch (error) {
                    notify({
                      title: "Unable to Delete Subject",
                      message: error.message,
                    });
                  }
                }}
            />
          )}



          {gradeToDelete && (
            <ConfirmDialog
              title="Delete Grade"
              message={`Are you sure you want to delete the ${gradeToDelete.grade} grading rule?`}
              onConfirm={async () => {
                const grade = gradeToDelete;

                if (!grade) return;

                try {
                  const data = await apiRequest(
                    `/result-settings/grading-scales/${grade.id}`,
                    {
                      method: "DELETE",
                    }
                  );

                  setGradingScale((prev) =>
                    prev.filter((item) => item.id !== grade.id)
                  );

                  setGradeToDelete(null);

                  notify({
                    title: "Grade Deleted",
                    message:
                      data.message ||
                      "The grading rule has been deleted successfully.",
                  });
                } catch (error) {
                  notify({
                    title: "Unable to Delete Grade",
                    message: error.message,
                  });
                }
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
                    onClick={async () => {
                      const { stream, selectedLevels } = streamLevelDialog;

                      if (!stream) {
                        notify({
                          title: "No Stream Selected",
                          message: "Please select a stream before saving its academic levels.",
                        });
                        return;
                      }

                      if (!selectedLevels.length) {
                        notify({
                          title: "Select Academic Levels",
                          message: "A stream must be assigned to at least one academic level.",
                        });
                        return;
                      }

                      try {
                        const data = await apiRequest("/streams/" + stream.id, {
                          method: "PATCH",
                          body: JSON.stringify({
                            academicLevelIds: selectedLevels,
                          }),
                        });

                        const savedStream = data.stream;
                        const savedLevelIds = data.academicLevelIds ?? [];

                        setStreams((prev) =>
                          prev.map((item) =>
                            item.id === savedStream.id
                              ? {
                                  ...item,
                                  name: savedStream.name,
                                  code: savedStream.code,
                                  description: savedStream.description ?? "",
                                  isActive: savedStream.is_active,
                                  academicLevelIds: savedLevelIds,
                                  academicLevels: savedStream.academic_levels ?? [],
                                }
                              : item
                          )
                        );

                        setStreamLevels((prev) => [
                          ...prev.filter((item) => item.streamId !== savedStream.id),
                          ...savedLevelIds.map((academicLevelId) => ({
                            id: savedStream.id + ":" + academicLevelId,
                            academicLevelId,
                            streamId: savedStream.id,
                            isActive: true,
                          })),
                        ]);

                        setStreamLevelDialog({
                          open: false,
                          stream: null,
                          selectedLevels: [],
                        });

                        notify({
                          title: "Levels Saved",
                          message: savedStream.name + " has been assigned to the selected academic levels.",
                        });
                      } catch (error) {
                        notify({
                          title: "Unable to Save Levels",
                          message: error.message,
                        });
                      }
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
          onClick={async () => {
            const {
              combination,
              selectedSubjects,
            } = combinationSubjectDialog;

            if (!combination) return;

            const validSubjectIds = selectedSubjects.filter((subjectId) => {
              const subject = subjects.find(
                (item) => item.id === subjectId
              );

              return subject?.academicLevelIds?.includes(
                combination.academicLevelId
              );
            });

            try {
              const data = await apiRequest(
                "/subject-combinations/" + combination.id,
                {
                  method: "PATCH",
                  body: JSON.stringify({
                    subjectIds: validSubjectIds,
                  }),
                }
              );

              const saved = data.subjectCombination;
              const savedSubjectIds = data.subjectIds ?? [];

              setSubjectCombinations((prev) =>
                prev.map((item) =>
                  item.id === saved.id
                    ? {
                        ...item,
                        academicLevelId: saved.academic_level_id,
                        streamId: saved.stream_id,
                        name: saved.name,
                        code: saved.code,
                        isActive: saved.is_active,
                        subjectIds: savedSubjectIds,
                        subjects: subjects.filter((subject) =>
                          savedSubjectIds.includes(subject.id)
                        ),
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
                message: "Subjects for " + combination.name + " have been updated successfully.",
              });
            } catch (error) {
              notify({
                title: "Unable to Save Subjects",
                message: error.message,
              });
            }
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

                      onClick={async () => {
                        const { subject, selectedLevels } = subjectLevelDialog;

                        if (!subject) return;

                        if (selectedLevels.length === 0) {
                          notify({
                            title: "Select Academic Levels",
                            message: "A subject must belong to at least one academic level.",
                          });
                          return;
                        }

                        try {
                          const data = await apiRequest(`/subjects/${subject.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({
                              academicLevelIds: selectedLevels,
                            }),
                          });

                          const saved = data.subject;

                          if (!saved?.id) {
                            throw new Error("The server did not return the updated subject.");
                          }

                          const savedLevelIds = data.academicLevelIds ?? selectedLevels;

                          setSubjects((prev) =>
                            prev.map((item) =>
                              item.id === saved.id
                                ? {
                                    ...item,
                                    name: saved.name,
                                    code: saved.code,
                                    category: saved.category,
                                    isCore: saved.is_core,
                                    academicLevelIds: savedLevelIds,
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
                            message: `${saved.name} has been assigned to the selected academic levels.`,
                          });
                        } catch (error) {
                          notify({
                            title: "Unable to Save Levels",
                            message: error.message,
                          });
                        }
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