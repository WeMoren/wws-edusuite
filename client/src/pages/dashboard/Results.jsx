import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useOutletContext } from "react-router-dom";
import jsPDF from "jspdf";
import NotificationDialog from "../../components/common/NotificationDialog/NotificationDialog";
import "./Results.css";

const Results = () => {
  const {
    academicSessions,
    academicTerms,
    academicLevels,
    classes,
    sections,
    students,
    enrollments,
    subjects,
    results,
    setResults,
    attendance,
    subjectCombinations = [],
    streams = [],
  } = useOutletContext();

  const { authToken } = useAuth();
  const API_BASE_URL = "http://localhost:5000/api";

  const getStudentFullName = (student) =>
  [
    student?.firstName,
    student?.middleName,
    student?.lastName,
  ]
    .filter(
      (name) =>
        typeof name === "string" && name.trim() !== ""
    )
    .map((name) => name.trim())
    .join(" ");

  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [resultsLoaded, setResultsLoaded] = useState(false);
  const [loadedStudents, setLoadedStudents] = useState([]);
  const [loadedSubjects, setLoadedSubjects] = useState([]);
  const [scoreEntries, setScoreEntries] = useState({});

  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({
    title: "",
    message: "",
  });

  const [assessmentSettings, setAssessmentSettings] = useState({
    caMax: 30,
    examMax: 70,
  });

  const [gradingScale, setGradingScale] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

    const [schoolProfile, setSchoolProfile] = useState(null);
  const [documentAuthorization, setDocumentAuthorization] = useState(null);
  const [documentSettingsLoading, setDocumentSettingsLoading] = useState(true);
  const [documentSettingsLoaded, setDocumentSettingsLoaded] = useState(false);



  const notify = ({ title, message }) => {
    setNotification({
      title,
      message,
    });

    setShowNotification(true);
  };


    useEffect(() => {
    let cancelled = false;

    const loadResultSettings = async () => {
      setSettingsLoading(true);

      try {
        if (!authToken) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/result-settings`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load result settings."
          );
        }

        if (cancelled) return;

        setAssessmentSettings(data.assessmentSettings);
        setGradingScale(data.gradingScale);
        setSettingsLoaded(true);
      } catch (error) {
        if (cancelled) return;

        notify({
          title: "Unable to Load Result Settings",
          message: error.message,
        });
      } finally {
        if (!cancelled) {
          setSettingsLoading(false);
        }
      }
    };

    loadResultSettings();

    return () => {
      cancelled = true;
    };
  }, [authToken]);


  useEffect(() => {
    let cancelled = false;

    const loadDocumentSettings = async () => {
      setDocumentSettingsLoading(true);
      setDocumentSettingsLoaded(false);

      try {
        if (!authToken) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        const headers = {
          Authorization: `Bearer ${authToken}`,
        };

        const [profileResponse, officialsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/school-profile`, { headers }),
          fetch(`${API_BASE_URL}/school-officials`, { headers }),
        ]);

        const [profileData, officialsData] = await Promise.all([
          profileResponse.json().catch(() => ({})),
          officialsResponse.json().catch(() => ({})),
        ]);

        if (!profileResponse.ok) {
          throw new Error(
            profileData.message || "Failed to load the school profile."
          );
        }

        if (!officialsResponse.ok) {
          throw new Error(
            officialsData.message || "Failed to load school officials."
          );
        }

        if (cancelled) return;

        const profile = profileData.profile || {};

        setSchoolProfile({
          name: profile.name || "",
          address: profile.address || "",
          phone: profile.phone || "",
          email: profile.email || "",
          website: profile.website || "",
          logo: profile.logo_url || "",
        });

        const defaults = {
          principal: {
            name: "",
            title: "Principal",
            signature: "",
            stamp: "",
          },
          examOfficer: {
            name: "",
            title: "Exam Officer",
            signature: "",
            stamp: "",
          },
        };

        const typeMap = {
          principal: "principal",
          exam_officer: "examOfficer",
        };

        const authorization = { ...defaults };

        for (const official of officialsData.officials || []) {
          const key = typeMap[official.official_type];
          if (!key) continue;

          authorization[key] = {
            name: official.name || "",
            title: official.title || defaults[key].title,
            signature: official.signature_url || "",
            stamp: official.stamp_url || "",
          };
        }

        setDocumentAuthorization(authorization);
        setDocumentSettingsLoaded(true);
      } catch (error) {
        if (cancelled) return;

        notify({
          title: "Unable to Load Document Settings",
          message: error.message,
        });
      } finally {
        if (!cancelled) {
          setDocumentSettingsLoading(false);
        }
      }
    };

    loadDocumentSettings();

    return () => {
      cancelled = true;
    };
  }, [authToken]);


  /* --------------------------------
      Academic helpers
  -------------------------------- */

  const getStudentEnrollment = (
    student,
    sessionId = selectedSessionId
  ) => {
    return enrollments.find(
      (enrollment) =>
        enrollment.studentId === String(student.id) &&
        enrollment.academicSessionId === String(sessionId)
    );
  };

  const getEnrollmentForSection = (
    student,
    sectionId,
    sessionId = selectedSessionId
  ) => {
    return enrollments.find(
      (enrollment) =>
        enrollment.studentId === student.id &&
        enrollment.academicSessionId === String(sessionId) &&
        enrollment.sectionId === String(sectionId)
    );
  };

  const getStudentAcademicContext = (student) => {
    const enrollment = getStudentEnrollment(student);

    if (!enrollment) {
      return null;
    }

    const section = sections.find(
      (item) => item.id === enrollment.sectionId
    );

    if (!section) {
      return null;
    }

    const classItem = classes.find(
      (item) =>
        item.id === section.classId &&
        item.academicSessionId === String(selectedSessionId)
    );

    if (!classItem) {
      return null;
    }

    const academicLevel = academicLevels.find(
      (item) =>
        item.id === classItem.academicLevelId
    );

    if (!academicLevel) {
      return null;
    }

    return {
      enrollment,
      section,
      classItem,
      academicLevel,
    };
  };


const getStudentAttendanceStats = (
  student,
  termId
) => {
  const context = getStudentAcademicContext(student);

  if (!context) {
    return {
      present: 0,
      absent: 0,
      totalMarked: 0,
      percentage: null,
    };
  }

  const { classItem } = context;

  const attendanceRecords = (attendance || []).filter(
    (record) =>
      record.studentId === student.id &&
      String(record.academicSessionId) === String(selectedSessionId) &&
      String(record.academicTermId) === String(termId) &&
      String(record.classId) === String(classItem.id)
  );

  const present = attendanceRecords.filter(
    (record) => record.status === "present"
  ).length;

  const absent = attendanceRecords.filter(
    (record) => record.status === "absent"
  ).length;

  const totalMarked = present + absent;

  const percentage =
    totalMarked > 0
      ? (present / totalMarked) * 100
      : null;

  return {
    present,
    absent,
    totalMarked,
    percentage,
  };
};


  /*
    Determine the exact subjects a student is allowed
    to take based on their academic level and, for SS2/SS3,
    their selected subject combination.
  */

const getStudentSubjectsForEnrollment = (
  student,
  enrollment
) => {
  if (!enrollment) {
    return [];
  }

  const section = sections.find(
    (item) => item.id === enrollment.sectionId
  );

  if (!section) {
    return [];
  }

  const classItem = classes.find(
    (item) =>
      item.id === section.classId &&
      String(item.academicSessionId) === String(selectedSessionId)
  );

  if (!classItem) {
    return [];
  }

  const level = academicLevels.find(
    (item) => item.id === classItem.academicLevelId
  );

  if (!level) {
    return [];
  }

  const levelSubjects = subjects.filter((subject) =>
    subject.academicLevelIds?.some(
      (levelId) => String(levelId) === String(level.id)
    )
  );

  const requiresCombination =
    level.name === "SS 2" ||
    level.name === "SS 3";

  if (!requiresCombination) {
    return levelSubjects;
  }

  if (!enrollment.combinationId) {
    return [];
  }

  const combination = subjectCombinations.find(
    (item) =>
      String(item.id) === String(enrollment.combinationId)
  );

  if (!combination) {
    return [];
  }

  return levelSubjects.filter((subject) =>
    combination.subjectIds?.some(
      (subjectId) => String(subjectId) === String(subject.id)
    )
  );
};


  /* --------------------------------
      Load results
  -------------------------------- */

  const handleLoadResults = () => {
    if (
      !selectedSessionId ||
      !selectedTermId ||
      !selectedClassId ||
      !selectedSectionId
    ) {
      notify({
        title: "Incomplete Selection",
        message:
          "Please select session, term, class, and section.",
      });

      return;
    }

    const sessionId = selectedSessionId;
    const classId = selectedClassId;
    const sectionId = selectedSectionId;
    const termId = selectedTermId;

    const selectedClass = classes.find(
      (classItem) =>
        String(classItem.id) === String(classId) &&
        String(classItem.academicSessionId) === String(sessionId)
    );

    const selectedSection = sections.find(
      (section) =>
        section.id === sectionId &&
        section.classId === classId
    );

    if (!selectedClass || !selectedSection) {
      notify({
        title: "Invalid Selection",
        message:
          "The selected class and section do not match.",
      });

      return;
    }

    const studentIds = enrollments
      .filter(
        (enrollment) =>
          String(enrollment.academicSessionId) === String(sessionId) &&
          String(enrollment.sectionId) === String(sectionId)
      )
      .map((enrollment) => enrollment.studentId);

    const matchingStudents = students.filter((student) =>
      studentIds.includes(String(student.id))
    );

    /*
      loadedSubjects remains the academic-level subject list
      because the entry table is shared across students.

      Each individual student's actual offered subjects are
      resolved separately below.
    */
    const matchingSubjects = subjects.filter((subject) =>
      subject.academicLevelIds?.some(
        (levelId) =>
          String(levelId) ===
          String(selectedClass.academicLevelId)
      )
    );

    setLoadedStudents(matchingStudents);
    setLoadedSubjects(matchingSubjects);

    const existingScores = {};

    matchingStudents.forEach((student) => {
      const enrollment =
        getStudentEnrollment(
          student,
          sessionId
        );

      const studentSubjects =
        getStudentSubjectsForEnrollment(
          student,
          enrollment
        );

      studentSubjects.forEach((subject) => {
        const existingResult = results.find(
          (result) =>
            result.studentId === student.id &&
            result.subjectId === subject.id &&
            result.academicSessionId === sessionId &&
            result.academicTermId === termId &&
            result.sectionId === sectionId
        );

        if (existingResult) {
          existingScores[
            `${student.id}-${subject.id}`
          ] = {
            ca: existingResult.ca,
            exam: existingResult.exam,
          };
        }
      });
    });

    setScoreEntries(existingScores);
    setResultsLoaded(true);
  };

  /* --------------------------------
      Save results
  -------------------------------- */


const handleSaveResults = () => {
  let updatedResults = results.filter((result) => {
    const student = loadedStudents.find(
      (item) => item.id === result.studentId
    );

    if (!student) {
      return true;
    }

    const enrollment = getStudentEnrollment(
      student,
      selectedSessionId
    );

    if (!enrollment) {
      return true;
    }

    const studentSubjects =
      getStudentSubjectsForEnrollment(
        student,
        enrollment
      );

    const isSameResultPeriod =
      String(result.academicSessionId) === String(selectedSessionId) &&
      String(result.academicTermId) === String(selectedTermId) &&
      String(result.sectionId) === String(selectedSectionId);

    if (!isSameResultPeriod) {
      return true;
    }

    return studentSubjects.some(
      (subject) =>
        String(subject.id) === String(result.subjectId)
    );
  });

  loadedStudents.forEach((student) => {
    const enrollment = getStudentEnrollment(
      student,
      selectedSessionId
    );

    const studentSubjects =
      getStudentSubjectsForEnrollment(
        student,
        enrollment
      );

    studentSubjects.forEach((subject) => {
      const entryKey = `${student.id}-${subject.id}`;
      const entry = scoreEntries[entryKey];

      if (!entry) {
        return;
      }

      const ca = Number(entry.ca) || 0;
      const exam = Number(entry.exam) || 0;

      const existingIndex = updatedResults.findIndex(
        (result) =>
          result.studentId === student.id &&
          String(result.subjectId) === String(subject.id) &&
          String(result.academicSessionId) === String(selectedSessionId) &&
          String(result.academicTermId) === String(selectedTermId) &&
          String(result.sectionId) === String(selectedSectionId)
      );

      const resultData = {
        studentId: student.id,
        subjectId: subject.id,
        academicSessionId: selectedSessionId,
        academicTermId: selectedTermId,
        sectionId: selectedSectionId,
        ca,
        exam,
      };

      if (existingIndex !== -1) {
        updatedResults[existingIndex] = {
          ...updatedResults[existingIndex],
          ...resultData,
        };
      } else {
        updatedResults.push({
          id: Date.now() + updatedResults.length,
          ...resultData,
        });
      }
    });
  });

  setResults(updatedResults);

  notify({
    title: "Results Saved",
    message: "Student results have been saved successfully.",
  });
};


  /* --------------------------------
      Result calculations
  -------------------------------- */


const getStudentTermAverage = (
  student,
  termId
) => {
  const enrollment = getStudentEnrollment(
    student,
    selectedSessionId
  );

  if (!enrollment) {
    return null;
  }

  const studentSubjects = getStudentSubjectsForEnrollment(
    student,
    enrollment
  );

  if (studentSubjects.length === 0) {
    return null;
  }

  const savedResults = results.filter(
    (result) =>
      result.studentId === student.id &&
      String(result.academicSessionId) === String(selectedSessionId) &&
      String(result.academicTermId) === String(termId) &&
      String(result.sectionId) === String(enrollment.sectionId)
  );

  if (savedResults.length === 0) {
    return null;
  }

  let totalScore = 0;
  let subjectCount = 0;

  studentSubjects.forEach((subject) => {
    const result = savedResults.find(
      (item) => String(item.subjectId) === String(subject.id)
    );

    if (!result) {
      return;
    }

    const ca = Number(result.ca) || 0;
    const exam = Number(result.exam) || 0;

    totalScore += ca + exam;
    subjectCount += 1;
  });

  if (subjectCount === 0) {
    return null;
  }

  return totalScore / subjectCount;
};



const getSessionTermIds = () => {
  return academicTerms
    .filter(
      (term) =>
        String(term.academicSessionId) === String(selectedSessionId)
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 3)
    .map((term) => term.id);
};


  const getStudentSessionAverage = (
    student
  ) => {
    const termIds = getSessionTermIds();

    if (termIds.length < 3) {
      return null;
    }

    const termAverages = termIds.map(
      (termId) =>
        getStudentTermAverage(
          student,
          termId
        )
    );

    if (
      termAverages.some(
        (average) =>
          average === null ||
          average === undefined
      )
    ) {
      return null;
    }

    const sessionAverage =
      termAverages.reduce(
        (sum, average) =>
          sum + average,
        0
      ) / 3;

    return sessionAverage;
  };

  const formatPosition = (position) => {
    if (!position) {
      return "—";
    }

    const lastTwoDigits =
      position % 100;

    if (
      lastTwoDigits >= 11 &&
      lastTwoDigits <= 13
    ) {
      return `${position}th`;
    }

    switch (position % 10) {
      case 1:
        return `${position}st`;

      case 2:
        return `${position}nd`;

      case 3:
        return `${position}rd`;

      default:
        return `${position}th`;
    }
  };

  const getCompetitionPosition = (
    studentsToRank,
    student,
    averageGetter
  ) => {
    const rankedStudents = studentsToRank
      .map((item) => ({
        student: item,
        average: averageGetter(item),
      }))
      .filter(
        (item) =>
          item.average !== null &&
          item.average !== undefined &&
          Number.isFinite(item.average)
      )
      .sort(
        (a, b) =>
          b.average - a.average
      );

    const studentAverage =
      averageGetter(student);

    if (
      studentAverage === null ||
      studentAverage === undefined ||
      !Number.isFinite(studentAverage)
    ) {
      return null;
    }

    const studentExists =
      rankedStudents.some(
        (item) =>
          item.student.id ===
          student.id
      );

    if (!studentExists) {
      return null;
    }

    const position =
      rankedStudents.filter(
        (item) =>
          item.average >
          studentAverage
      ).length + 1;

    return {
      position,
      total: rankedStudents.length,
      average: studentAverage,
    };
  };


const getStudentPositions = (student) => {
  const context = getStudentAcademicContext(student);

  if (!context) {
    return {
      classPositionLabel: "—",
      academicLevelPositionLabel: "—",
      sessionAcademicLevelPositionLabel: "—",
      classTotal: 0,
      academicLevelTotal: 0,
      sessionAcademicLevelTotal: 0,
      termAverage: null,
      sessionAverage: null,
    };
  }

  const { classItem, academicLevel } = context;
  const sessionId = selectedSessionId;

  const enrolledStudents = students.filter((item) =>
    enrollments.some(
      (enrollment) =>
        enrollment.studentId === item.id &&
        String(enrollment.academicSessionId) === String(sessionId) &&
        Boolean(enrollment.sectionId)
    )
  );

  const classStudents = enrolledStudents.filter((item) => {
    const itemContext = getStudentAcademicContext(item);

    return (
      String(itemContext?.classItem?.id) === String(classItem.id)
    );
  });

  const academicLevelStudents = enrolledStudents.filter((item) => {
    const itemContext = getStudentAcademicContext(item);

    return (
      String(itemContext?.academicLevel?.id) === String(academicLevel.id)
    );
  });

  const currentTermAverage = getStudentTermAverage(
    student,
    selectedTermId
  );

  const classPosition = getCompetitionPosition(
    classStudents,
    student,
    (item) => getStudentTermAverage(item, selectedTermId)
  );

  const academicLevelPosition = getCompetitionPosition(
    academicLevelStudents,
    student,
    (item) => getStudentTermAverage(item, selectedTermId)
  );

  let sessionAcademicLevelPosition = null;
  let sessionAverage = null;

  const sessionTermIds = getSessionTermIds();
  const isThirdTerm =
    String(selectedTermId) === String(sessionTermIds[2]);

  if (isThirdTerm) {
    sessionAverage = getStudentSessionAverage(student);

    sessionAcademicLevelPosition = getCompetitionPosition(
      academicLevelStudents,
      student,
      (item) => getStudentSessionAverage(item)
    );
  }

  return {
    classPosition: classPosition?.position || null,

    classPositionLabel: classPosition
      ? `${formatPosition(classPosition.position)} of ${classPosition.total}`
      : "—",

    classTotal: classPosition?.total || 0,

    academicLevelPosition: academicLevelPosition?.position || null,

    academicLevelPositionLabel: academicLevelPosition
      ? `${formatPosition(academicLevelPosition.position)} of ${academicLevelPosition.total}`
      : "—",

    academicLevelTotal: academicLevelPosition?.total || 0,

    sessionAcademicLevelPosition:
      sessionAcademicLevelPosition?.position || null,

    sessionAcademicLevelPositionLabel: sessionAcademicLevelPosition
      ? `${formatPosition(sessionAcademicLevelPosition.position)} of ${sessionAcademicLevelPosition.total}`
      : "—",

    sessionAcademicLevelTotal:
      sessionAcademicLevelPosition?.total || 0,

    termAverage: currentTermAverage,
    sessionAverage,
  };
};

  /* --------------------------------
      Student result data
  -------------------------------- */


const getStudentResultData = (student) => {
  const enrollment = getStudentEnrollment(
    student,
    selectedSessionId
  );

  const studentSubjects = getStudentSubjectsForEnrollment(
    student,
    enrollment
  );

  const studentResults = studentSubjects.map((subject) => {
    const entryKey = `${student.id}-${subject.id}`;

    const entry = scoreEntries[entryKey] || {
      ca: 0,
      exam: 0,
    };

    const ca = Number(entry.ca) || 0;
    const exam = Number(entry.exam) || 0;
    const total = ca + exam;

    const grading = gradingScale.find(
      (item) => total >= item.min && total <= item.max
    );

    return {
      subjectId: subject.id,
      subject: subject.name,
      ca,
      exam,
      total,
      grade: grading?.grade || "-",
      remark: grading?.remark || "-",
    };
  });

  const positions = getStudentPositions(student);

  const attendanceStats = getStudentAttendanceStats(
    student,
    selectedTermId
  );

  return {
    student,
    results: studentResults,
    positions,
    attendanceStats,
  };
};


  /* --------------------------------
      Download result
  -------------------------------- */


const handleDownloadResult = (student) => {
  const resultData = getStudentResultData(student);

  const enrollment = getStudentEnrollment(
    student,
    selectedSessionId
  );

  const studentStream = streams.find(
    (stream) =>
      String(stream.id) === String(enrollment?.streamId)
  );

  const studentSubjects = getStudentSubjectsForEnrollment(
    student,
    enrollment
  );

  const totalSubjectsOffered = studentSubjects.length;

  const studentSubjectIds = studentSubjects.map(
    (subject) => subject.id
  );

  const attendanceStats = resultData.attendanceStats || {
    present: 0,
    absent: 0,
    totalMarked: 0,
    percentage: null,
  };

    if (
    documentSettingsLoading ||
    !documentSettingsLoaded ||
    !schoolProfile ||
    !documentAuthorization
  ) {
    notify({
      title: "Document Settings Unavailable",
      message:
        "The latest school profile and official details must load successfully before downloading this result.",
    });
    return;
  }

      const selectedSession = academicSessions.find(
        (session) =>
          String(session.id) === String(selectedSessionId)
      );

      const selectedTerm = academicTerms.find(
        (term) =>
          String(term.id) === String(selectedTermId)
      );

      const selectedClass = classes.find(
        (classItem) =>
          String(classItem.id) === String(selectedClassId)
      );

      const selectedSection = sections.find(
        (section) =>
          String(section.id) === String(selectedSectionId)
      );


    const doc = new jsPDF();

    const pageHeight =
      doc.internal.pageSize.getHeight();

    const bottomMargin = 25;

    let y = 20;

    const addPageIfNeeded = (
      requiredSpace = 10
    ) => {
      if (
        y + requiredSpace >
        pageHeight - bottomMargin
      ) {
        doc.addPage();
        y = 20;
        return true;
      }

      return false;
    };

    const drawResultsHeader = () => {
      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(10);

      doc.text(
        "Subject",
        20,
        y
      );

      doc.text(
        "CAT",
        90,
        y
      );

      doc.text(
        "Exam",
        115,
        y
      );

      doc.text(
        "Total",
        140,
        y
      );

      doc.text(
        "Grade",
        160,
        y
      );

      doc.text(
        "Remark",
        180,
        y
      );

      y += 5;

      doc.setDrawColor(
        220,
        220,
        220
      );

      doc.line(
        20,
        y,
        190,
        y
      );

      y += 8;

      doc.setFont(
        "helvetica",
        "normal"
      );
    };

    /* --------------------------------
        School Header
    -------------------------------- */

    if (schoolProfile.logo) {
      try {
        doc.addImage(
          schoolProfile.logo,
          "PNG",
          85,
          10,
          40,
          40
        );

        y = 58;
      } catch (error) {
        console.error(
          "Unable to add school logo to result PDF:",
          error
        );
      }
    }

    doc.setFontSize(18);

    doc.text(
      schoolProfile.name ||
        "School",
      105,
      y,
      {
        align: "center",
      }
    );

    y += 8;

    doc.setFontSize(10);

    if (schoolProfile.address) {
      doc.text(
        schoolProfile.address,
        105,
        y,
        {
          align: "center",
        }
      );

      y += 6;
    }

    if (
      schoolProfile.phone ||
      schoolProfile.email
    ) {
      const contactInfo = [
        schoolProfile.phone,
        schoolProfile.email,
      ]
        .filter(Boolean)
        .join(" | ");

      doc.text(
        contactInfo,
        105,
        y,
        {
          align: "center",
        }
      );

      y += 10;
    }

    /* --------------------------------
        Result title
    -------------------------------- */

    doc.setFontSize(14);

    doc.text(
      "STUDENT RESULT",
      105,
      y,
      {
        align: "center",
      }
    );

    y += 14;

    /* --------------------------------
        Student information
    -------------------------------- */

    addPageIfNeeded(55);


    const infoX = 20;
    const infoY = y - 6;
    const infoWidth = 170;

    doc.setFontSize(10);

    const studentName = getStudentFullName(student) || "—";

    const studentInfo = [
      ["Student:", studentName],
      ["Gender:", student.gender || "—"],
      ["Admission No:", student.admissionNo || "—"],
      ["Class:", selectedClass?.name || "—"],
      ["Section:", selectedSection?.name || "—"],
      ["Category:", studentStream?.name || "—"],
      ["Subjects Offered:", totalSubjectsOffered],
      ["Session:", selectedSession?.name || "—"],
      ["Term:", selectedTerm?.name || "—"],
    ];

    const leftColumnX = 25;
    const leftValueX = 65;
    const rightColumnX = 105;
    const rightValueX = 145;

    const leftLabelWidth = 37;
    const leftValueWidth = 35;
    const rightLabelWidth = 37;
    const rightValueWidth = 40;

    const lineHeight = 5;
    const rowPadding = 2;

    const wrapInfoText = (value, width, fontStyle) => {
      doc.setFont("helvetica", fontStyle);

      return doc.splitTextToSize(
        String(value ?? "—"),
        width
      );
    };

    const createInfoItem = (
      label,
      value,
      labelX,
      valueX,
      labelWidth,
      valueWidth
    ) => {
      const labelLines = wrapInfoText(
        label,
        labelWidth,
        "bold"
      );

      const valueLines = wrapInfoText(
        value,
        valueWidth,
        "normal"
      );

      return {
        labelLines,
        valueLines,
        labelX,
        valueX,
        lineCount: Math.max(
          labelLines.length,
          valueLines.length,
          1
        ),
      };
    };

    const infoRows = [];

    // Give the full student name its own row.
    infoRows.push({
      items: [
        createInfoItem(
          "Student:",
          studentName,
          leftColumnX,
          leftValueX,
          leftLabelWidth,
          120
        ),
      ],
    });

    // Keep all remaining information in two columns.
    const remainingInfo = studentInfo.slice(1);

    for (
      let index = 0;
      index < remainingInfo.length;
      index += 2
    ) {
      const pair = remainingInfo.slice(index, index + 2);

      const items = pair.map(
        ([label, value], columnIndex) => {
          const isRightColumn = columnIndex === 1;

          return createInfoItem(
            label,
            value,
            isRightColumn
              ? rightColumnX
              : leftColumnX,
            isRightColumn
              ? rightValueX
              : leftValueX,
            isRightColumn
              ? rightLabelWidth
              : leftLabelWidth,
            isRightColumn
              ? rightValueWidth
              : leftValueWidth
          );
        }
      );

      infoRows.push({ items });
    }

    // Calculate each row's height from its longest wrapped field.
    infoRows.forEach((row) => {
      const lineCount = Math.max(
        ...row.items.map((item) => item.lineCount),
        1
      );

      row.height = lineCount * lineHeight + rowPadding;
    });

    // Calculate the box height before drawing it.
    const infoHeight =
      9 +
      infoRows.reduce(
        (total, row) => total + row.height,
        0
      ) +
      3;

    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 250, 252);

    doc.roundedRect(
      infoX,
      infoY,
      infoWidth,
      infoHeight,
      3,
      3,
      "FD"
    );

    // Draw every label and value within its allocated width.
    let rowY = infoY + 9;

    infoRows.forEach((row) => {
      row.items.forEach((item) => {
        doc.setFont("helvetica", "bold");

        doc.text(
          item.labelLines,
          item.labelX,
          rowY
        );

        doc.setFont("helvetica", "normal");

        doc.text(
          item.valueLines,
          item.valueX,
          rowY
        );
      });

      rowY += row.height;
    });

    // Start the results table below the complete information box.
    y = infoY + infoHeight + 10;


    /* --------------------------------
        Results table
    -------------------------------- */

    const tableX = 20;
    const tableWidth = 170;

    const columnWidths = [
      55,
      20,
      20,
      20,
      20,
      35,
    ];

    const columnX =
      columnWidths.reduce(
        (
          positions,
          width,
          index
        ) => {
          if (index === 0) {
            positions.push(
              tableX
            );
          } else {
            positions.push(
              positions[
                index - 1
              ] +
                columnWidths[
                  index - 1
                ]
            );
          }

          return positions;
        },
        []
      );

    const rowHeight = 9;

    const drawTableHeader =
      () => {
        doc.setFillColor(
          248,
          250,
          252
        );

        doc.setDrawColor(
          220,
          220,
          220
        );

        doc.rect(
          tableX,
          y - 6,
          tableWidth,
          rowHeight,
          "FD"
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(9);

        const headers = [
          "Subject",
          "CAT",
          "Exam",
          "Total",
          "Grade",
          "Remark",
        ];

        headers.forEach(
          (header, index) => {
            doc.text(
              header,
              columnX[index] +
                3,
              y
            );
          }
        );

        y += rowHeight;

        doc.setFont(
          "helvetica",
          "normal"
        );
      };

  const drawTableRow = (result) => {
     const isOffered = studentSubjectIds.some(
    (subjectId) =>
      String(subjectId) === String(result.subjectId)
  );

  // If subject is not offered, mark all fields as N/A
  const ca = isOffered ? (Number(result.ca) || 0) : "N/A";
  const exam = isOffered ? (Number(result.exam) || 0) : "N/A";
  const total = isOffered ? (Number(result.total) || 0) : "N/A";
  const grade = isOffered ? (result.grade || "-") : "N/A";
  const remark = isOffered ? (result.remark || "-") : "N/A";

  const subjectLines = doc.splitTextToSize(
    String(result.subject),
    columnWidths[0] - 6
  );

  const remarkLines = doc.splitTextToSize(
    String(remark),
    columnWidths[5] - 6
  );

  const lineCount = Math.max(subjectLines.length, remarkLines.length, 1);
  const currentRowHeight = Math.max(rowHeight, lineCount * 5 + 4);

  if (y + currentRowHeight > pageHeight - bottomMargin) {
    doc.addPage();
    y = 20;
    drawTableHeader();
  }

  doc.setDrawColor(220, 220, 220);

  let currentX = tableX;
  columnWidths.forEach((width) => {
    doc.rect(currentX, y - 6, width, currentRowHeight);
    currentX += width;
  });

  doc.setFontSize(9);

  // Subject name
  doc.text(subjectLines, columnX[0] + 3, y);

  // CA
  doc.text(String(ca), columnX[1] + columnWidths[1] / 2, y, {
    align: "center",
  });

  // Exam
  doc.text(String(exam), columnX[2] + columnWidths[2] / 2, y, {
    align: "center",
  });

  // Total
  doc.text(String(total), columnX[3] + columnWidths[3] / 2, y, {
    align: "center",
  });

  // Grade
  doc.text(String(grade), columnX[4] + columnWidths[4] / 2, y, {
    align: "center",
  });

  // Remark
  doc.text(remarkLines, columnX[5] + 3, y);

  y += currentRowHeight;
};


    addPageIfNeeded(25);

    drawTableHeader();

    resultData.results.forEach(
      (result) => {
        drawTableRow(result);
      }
    );

    /* --------------------------------
        Overall result
    -------------------------------- */

    addPageIfNeeded(65);

    y += 5;

    const totalScore =
      resultData.results.reduce(
        (sum, result) =>
          sum + (Number(result.total) || 0),
        0
      );

    const subjectCount =
      resultData.results.length;

    const average =
      subjectCount > 0
        ? (
            totalScore /
            subjectCount
          ).toFixed(2)
        : "0.00";

    const overallGrade =
      gradingScale.find(
        (item) =>
          Number(average) >=
            item.min &&
          Number(average) <=
            item.max
      );

    const summaryX = 20;
    const summaryY = y - 5;
    const summaryWidth = 170;
    const summaryHeight =
      String(selectedTermId) ===
      String(getSessionTermIds()[2])
        ? 80
        : 65;

    doc.setDrawColor(
      220,
      220,
      220
    );

    doc.setFillColor(
      248,
      250,
      252
    );

    doc.roundedRect(
      summaryX,
      summaryY,
      summaryWidth,
      summaryHeight,
      3,
      3,
      "FD"
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(12);

    doc.text(
      "Overall Result",
      summaryX + 5,
      summaryY + 9
    );

    doc.setFontSize(10);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.text(
      `Total Score: ${totalScore}`,
      summaryX + 5,
      summaryY + 19
    );

    doc.text(
      `Average: ${average}%`,
      summaryX + 5,
      summaryY + 28
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.text(
      `Grade: ${
        overallGrade?.grade ||
        "-"
      }`,
      summaryX + 95,
      summaryY + 19
    );

    doc.text(
      `Remark: ${
        overallGrade?.remark ||
        "-"
      }`,
      summaryX + 95,
      summaryY + 28
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.text(
      `Class Position: ${
        resultData.positions
          .classPositionLabel
      }`,
      summaryX + 5,
      summaryY + 40
    );

    doc.text(
      `Academic Level Position: ${
        resultData.positions
          .academicLevelPositionLabel
      }`,
      summaryX + 95,
      summaryY + 40
    );

    doc.text(
      `Attendance: ${
        attendanceStats.percentage !== null
          ? attendanceStats.percentage.toFixed(2) + "%"
          : "—"
      }`,
      summaryX + 5,
      summaryY + 51
    );

    if (
      String(selectedTermId) ===
      String(getSessionTermIds()[2])
    ) {
      doc.text(
        `Session Average: ${
          resultData.positions
            .sessionAverage !==
          null
            ? resultData.positions.sessionAverage.toFixed(
                2
              ) + "%"
            : "—"
        }`,
        summaryX + 5,
        summaryY + 62
      );

      doc.text(
        `Final Academic Level Position: ${
          resultData.positions
            .sessionAcademicLevelPositionLabel
        }`,
        summaryX + 95,
        summaryY + 62
      );
    }

    y =
      summaryY +
      summaryHeight +
      10;

          /* --------------------------------
              Official signatures/stamps
          -------------------------------- */

          addPageIfNeeded(60);

          const signatureTopY = y;

          const signatureWidth = 75;
          const signatureHeight = 18;

          const leftSignatureX = 25;
          const rightSignatureX = 110;

          const examOfficer =
            documentAuthorization.examOfficer;

          const principal =
            documentAuthorization.principal;

          const drawOfficial = ({
            official,
            x,
            fallbackTitle,
          }) => {
            const officialName =
              official?.name || "—";

            const officialTitle =
              official?.title ||
              fallbackTitle;

            doc.setFont(
              "helvetica",
              "bold"
            );

            doc.setFontSize(10);

            doc.text(
              officialName,
              x,
              signatureTopY
            );

            doc.setFont(
              "helvetica",
              "normal"
            );

            doc.setFontSize(8);

            doc.text(
              officialTitle,
              x,
              signatureTopY + 7
            );

            /*
              Digital signature
            */

            if (official?.signature) {
              try {
                doc.addImage(
                  official.signature,
                  "PNG",
                  x,
                  signatureTopY + 11,
                  signatureWidth,
                  signatureHeight
                );
              } catch (error) {
                console.error(
                  `Unable to add ${officialTitle} digital signature:`,
                  error
                );
              }
            }

            /*
              Physical signature area
            */

            doc.line(
              x,
              signatureTopY + 32,
              x + signatureWidth,
              signatureTopY + 32
            );

            /*
              Digital stamp
            */

            if (official?.stamp) {
              try {
                doc.addImage(
                  official.stamp,
                  "PNG",
                  x + 48,
                  signatureTopY + 34,
                  27,
                  27
                );
              } catch (error) {
                console.error(
                  `Unable to add ${officialTitle} digital stamp:`,
                  error
                );
              }
            }

            /*
              Physical stamp area
            */

            doc.setFontSize(7);

            doc.text(
              "Signature / Stamp",
              x,
              signatureTopY + 40
            );
          };

          drawOfficial({
            official: examOfficer,
            x: leftSignatureX,
            fallbackTitle: "Exam Officer",
          });

          drawOfficial({
            official: principal,
            x: rightSignatureX,
            fallbackTitle: "Principal",
          });

          y =
            signatureTopY +
            68;
    /* --------------------------------
        Footer + page numbers
    -------------------------------- */

    const totalPages =
      doc.internal.getNumberOfPages();

    const generatedDate =
      new Date().toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );

    for (
      let page = 1;
      page <= totalPages;
      page++
    ) {
      doc.setPage(page);

      const footerY =
        pageHeight - 15;

      doc.setDrawColor(
        225,
        225,
        225
      );

      doc.line(
        20,
        footerY - 7,
        190,
        footerY - 7
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(7);

      doc.setTextColor(
        150,
        150,
        150
      );

      doc.text(
        `Generated: ${generatedDate}`,
        20,
        footerY
      );

      doc.text(
        `Page ${page} of ${totalPages}`,
        105,
        footerY,
        {
          align: "center",
        }
      );

      doc.text(
        "Powered by WeMoren Web Services",
        190,
        footerY,
        {
          align: "right",
        }
      );

      doc.setTextColor(
        0,
        0,
        0
      );
    }

    doc.save(
      `${getStudentFullName(student).replace(/\s+/g, "-")}-Result.pdf`
    );
  };

  /* --------------------------------
      Render
  -------------------------------- */

  return (
    <div className="results-page">
      <h1>Results</h1>

      <p>
        Enter and manage student academic
        results.
      </p>

      <div className="results-filters">
        <div>
          <label>
            Academic Session
          </label>

          <select
            value={selectedSessionId}
            onChange={(e) => {
              setSelectedSessionId(
                e.target.value
              );

              setSelectedTermId("");
              setSelectedClassId("");
              setSelectedSectionId("");
              setResultsLoaded(false);
            }}
          >
            <option value="">
              Select session
            </option>

            {academicSessions.map(
              (session) => (
                <option
                  key={session.id}
                  value={session.id}
                >
                  {session.name}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label>
            Academic Term
          </label>

          <select
            value={selectedTermId}
            onChange={(e) => {
              setSelectedTermId(
                e.target.value
              );

              setResultsLoaded(false);
            }}
          >
            <option value="">
              Select term
            </option>

            {academicTerms
              .filter(
                (term) =>
                  term.academicSessionId ===
                  selectedSessionId
              )
              .map((term) => (
                <option
                  key={term.id}
                  value={term.id}
                >
                  {term.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label>
            Class
          </label>

          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(
                e.target.value
              );

              setSelectedSectionId("");
              setResultsLoaded(false);
            }}
          >
            <option value="">
              Select class
            </option>

            {classes
              .filter(
                (classItem) =>
                  !selectedSessionId ||
                  classItem.academicSessionId ===

                      selectedSessionId

              )
              .map((classItem) => (
                <option
                  key={classItem.id}
                  value={classItem.id}
                >
                  {classItem.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label>
            Section
          </label>

          <select
            value={selectedSectionId}
            onChange={(e) => {
              setSelectedSectionId(
                e.target.value
              );

              setResultsLoaded(false);
            }}
          >
            <option value="">
              Select section
            </option>

            {sections
              .filter(
                (section) =>
                  section.classId ===

                    selectedClassId

              )
              .map((section) => (
                <option
                  key={section.id}
                  value={section.id}
                >
                  {section.name}
                </option>
              ))}
          </select>
        </div>

        <button
          type="button"
          onClick={
            handleLoadResults
          }
        >
          Load Results
        </button>

        {showNotification && (
          <NotificationDialog
            title={
              notification.title
            }
            message={
              notification.message
            }
            onClose={() =>
              setShowNotification(
                false
              )
            }
          />
        )}
      </div>

      {resultsLoaded && (
        <div className="results-preview">
          <h2>
            Students & Subjects
          </h2>

          <div className="results-preview__students">
            <h3>Students</h3>

            {loadedStudents.length >
            0 ? (
              loadedStudents.map(
                (student) => (
                  <p key={student.id}>
                   {getStudentFullName(student)}
                  </p>
                )
              )
            ) : (
              <p>
                No students found for
                this class and section.
              </p>
            )}
          </div>

          <div className="results-preview__subjects">
            <h3>Subjects</h3>

            {loadedSubjects.length >
            0 ? (
              loadedSubjects.map(
                (subject) => (
                  <p
                    key={
                      subject.id
                    }
                  >
                    {subject.name}
                  </p>
                )
              )
            ) : (
              <p>
                No subjects have been
                assigned to this academic
                level.
              </p>
            )}
          </div>
        </div>
      )}

      {resultsLoaded &&
        settingsLoaded &&
        !settingsLoading &&
        loadedStudents.length >
          0 &&
        loadedSubjects.length >
          0 && (
          <div className="results-entry">
            <h2>
              Enter Results
            </h2>

            <div className="results-entry__table-wrapper">
              <table className="results-entry__table">
                <thead>
                  <tr>
                    <th>
                      Student
                    </th>

                    {loadedSubjects.map(
                      (subject) => (
                        <th
                          key={
                            subject.id
                          }
                        >
                          {
                            subject.name
                          }
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {loadedStudents.map(
                    (student) => {
                      const enrollment =
                        getStudentEnrollment(student, selectedSessionId);

                      const studentSubjects =
                        getStudentSubjectsForEnrollment(
                          student,
                          enrollment
                        );

                      return (
                        <tr
                          key={
                            student.id
                          }
                        >
                          <td>
                            {getStudentFullName(student)}
                          </td>

                          {loadedSubjects.map(
                            (subject) => {
                              const isSubjectOffered =
                                studentSubjects.some(
                                  (item) =>
                                    String(
                                      item.id
                                    ) ===
                                    String(
                                      subject.id
                                    )
                                );

                                 /*
                                  Unoffered subjects must be completely
                                  excluded from result entry and grading.
                                */
                                if (!isSubjectOffered) {
                                  return (
                                    <td
                                      key={subject.id}
                                      className="results-entry__not-offered"
                                    >
                                      <span>
                                        Not Offered
                                      </span>
                                    </td>
                                  );
                                }


                              const entryKey = `${student.id}-${subject.id}`;

                              const entry =
                                scoreEntries[
                                  entryKey
                                ] || {
                                  ca: "",
                                  exam: "",
                                };

                              const total =
                                (Number(
                                  entry.ca
                                ) || 0) +
                                (Number(
                                  entry.exam
                                ) || 0);

                              const grading =
                                gradingScale.find(
                                  (item) =>
                                    total >=
                                      item.min &&
                                    total <=
                                      item.max
                                );



                              return (
                                <td
                                  key={
                                    subject.id
                                  }
                                >
                                  <div className="results-entry__scores">
                                    <span className="results-entry__subject">
                                      {
                                        subject.name
                                      }
                                    </span>

                                    <label>
                                      CAT (
                                      {
                                        assessmentSettings.caMax
                                      }
                                      )

                                      <input
                                        type="number"
                                        min="0"
                                        max={
                                          assessmentSettings.caMax
                                        }
                                        value={
                                          entry.ca
                                        }
                                        onChange={(
                                          e
                                        ) =>
                                          setScoreEntries(
                                            (
                                              prev
                                            ) => ({
                                              ...prev,
                                              [entryKey]:
                                                {
                                                  ...entry,
                                                  ca: e
                                                    .target
                                                    .value,
                                                },
                                            })
                                          )
                                        }
                                      />
                                    </label>

                                    <label>
                                      Exam (
                                      {
                                        assessmentSettings.examMax
                                      }
                                      )

                                      <input
                                        type="number"
                                        min="0"
                                        max={
                                          assessmentSettings.examMax
                                        }
                                        value={
                                          entry.exam
                                        }
                                        onChange={(
                                          e
                                        ) =>
                                          setScoreEntries(
                                            (
                                              prev
                                            ) => ({
                                              ...prev,
                                              [entryKey]:
                                                {
                                                  ...entry,
                                                  exam: e
                                                    .target
                                                    .value,
                                                },
                                            })
                                          )
                                        }
                                      />
                                    </label>

                                    <strong>
                                      Total:{" "}
                                      {
                                        total
                                      }
                                    </strong>

                                    <strong>
                                      Grade:{" "}
                                      {
                                        grading?.grade ||
                                        "-"
                                      }
                                    </strong>

                                    <strong>
                                      Remark:{" "}
                                      {
                                        grading?.remark ||
                                        "-"
                                      }
                                    </strong>
                                  </div>
                                </td>
                              );
                            }
                          )}
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {resultsLoaded &&
        loadedStudents.length >
          0 &&
        loadedSubjects.length >
          0 && (
          <button
            type="button"
            onClick={
              handleSaveResults
            }
          >
            Save Results
          </button>
        )}

      {resultsLoaded &&
        loadedStudents.length >
          0 && (
          <div className="results-students">
            <div className="results-students__header">
              <h2>
                Student Results
              </h2>

              <p>
                Review positions and
                download individual
                student results.
              </p>
            </div>

            <div className="results-students__list">
              {loadedStudents.map(
                (student) => {
                  const studentPositions =
                    getStudentPositions(
                      student
                    );

                  return (
                    <div
                      key={
                        student.id
                      }
                      className="results-students__item"
                    >
                      <div className="results-students__info">
                        <strong>
                          {getStudentFullName(student)}
                        </strong>

                        <span>
                          Admission No:{" "}
                          {
                            student.admissionNo
                          }
                        </span>

                        <span>
                          Class Position:{" "}
                          {
                            studentPositions.classPositionLabel
                          }
                        </span>

                        <span>
                          Academic Level Position:{" "}
                          {
                            studentPositions.academicLevelPositionLabel
                          }
                        </span>

                        <span>
                          Attendance:{" "}
                          {(() => {
                            const attendanceStats =
                              getStudentAttendanceStats(
                                student,
                                Number(
                                  selectedTermId
                                )
                              );

                            return attendanceStats.percentage !==
                              null
                              ? `${attendanceStats.percentage.toFixed(
                                  2
                                )}%`
                              : "—";
                          })()}
                        </span>

                        {Number(
                          selectedTermId
                        ) ===
                          getSessionTermIds()[2] && (
                          <span>
                            Final Academic Level Position:{" "}
                            {
                              studentPositions.sessionAcademicLevelPositionLabel
                            }
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadResult(
                            student
                          )
                        }
                      >
                        Download Result
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default Results;