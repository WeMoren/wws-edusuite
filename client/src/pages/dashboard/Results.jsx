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

  const {currentUser, authToken } = useAuth();
  const API_BASE_URL = "http://localhost:5000/api";

    const currentUserRoles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : currentUser?.role
    ? [currentUser.role]
    : [];

  const canManageResultDocuments =
    currentUserRoles.includes("Principal") ||
    currentUserRoles.includes("Exam Officer");

  const canAuthorizeAsPrincipal =
    currentUserRoles.includes("Principal");

  const canAuthorizeAsExamOfficer =
    currentUserRoles.includes("Principal") ||
    currentUserRoles.includes("Exam Officer");

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
  const [savedResults, setSavedResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

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

  const [documentStatuses, setDocumentStatuses] = useState({});
  const [documentStatusesLoading, setDocumentStatusesLoading] = useState(false);
  const [documentStatusesError, setDocumentStatusesError] = useState(false);
  const [documentActionLoading, setDocumentActionLoading] = useState({});


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
          motto: profile.motto || "",
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

  
  const handleLoadResults = async () => {
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
        String(section.id) === String(sectionId) &&
        String(section.classId) === String(classId)
    );

    if (!selectedClass || !selectedSection) {
      notify({
        title: "Invalid Selection",
        message:
          "The selected class and section do not match.",
      });

      return;
    }

    setResultsLoading(true);
    setResultsLoaded(false);
    setSavedResults([]);
    setScoreEntries({});
    setDocumentStatuses({});
    setDocumentStatusesError(false);

    try {
      if (!authToken) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const studentIds = enrollments
        .filter(
          (enrollment) =>
            String(enrollment.academicSessionId) === String(sessionId) &&
            String(enrollment.sectionId) === String(sectionId)
        )
        .map((enrollment) => String(enrollment.studentId));

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

      const matchingEnrollmentIds = new Set(
        matchingStudents
          .map((student) =>
            getStudentEnrollment(student, sessionId)
          )
          .filter(Boolean)
          .map((enrollment) => String(enrollment.id))
      );

      const response = await fetch(
        `${API_BASE_URL}/results?termId=${encodeURIComponent(termId)}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load saved results."
        );
      }

      const mappedResults = (data.results || [])
        .filter((result) =>
          matchingEnrollmentIds.has(
            String(result.student_enrollment_id)
          )
        )
        .map((result) => {
          const enrollment = enrollments.find(
            (item) =>
              String(item.id) ===
              String(result.student_enrollment_id)
          );

          return {
            id: result.id,
            studentId: result.student_id,
            studentEnrollmentId: result.student_enrollment_id,
            subjectId: result.subject_id,
            academicSessionId: enrollment?.academicSessionId,
            academicTermId: result.term_id,
            sectionId: enrollment?.sectionId,
            ca: result.ca,
            exam: result.exam,
            total: result.total,
            grade: result.grade,
            remark: result.remark,
          };
        });

      const existingScores = {};

      matchingStudents.forEach((student) => {
        const enrollment = getStudentEnrollment(
          student,
          sessionId
        );

        const studentSubjects =
          getStudentSubjectsForEnrollment(
            student,
            enrollment
          );

        studentSubjects.forEach((subject) => {
          const existingResult = mappedResults.find(
            (result) =>
              String(result.studentEnrollmentId) ===
                String(enrollment?.id) &&
              String(result.subjectId) === String(subject.id)
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

      setLoadedStudents(matchingStudents);
      setLoadedSubjects(matchingSubjects);
      setSavedResults(mappedResults);
      setScoreEntries(existingScores);
      setResultsLoaded(true);

      notify({
        title: "Results Loaded",
        message:
          "Saved results have been loaded successfully.",
      });

            // Load result-document authorization statuses separately.
      // A lookup failure must not affect the successfully loaded results.
      setDocumentStatusesLoading(true);

      try {
        const enrollmentIds = matchingStudents
          .map((student) =>
            getStudentEnrollment(student, sessionId)
          )
          .filter(
            (enrollment) => enrollment?.id
          )
          .map((enrollment) => String(enrollment.id));

        const statusMap = {};

        for (
          let index = 0;
          index < enrollmentIds.length;
          index += 200
        ) {
          const enrollmentIdBatch = enrollmentIds.slice(
            index,
            index + 200
          );

          const statusResponse = await fetch(
            `${API_BASE_URL}/results/documents/lookup?termId=${encodeURIComponent(termId)}&studentEnrollmentIds=${encodeURIComponent(enrollmentIdBatch.join(","))}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          const statusData = await statusResponse
            .json()
            .catch(() => ({}));

          if (!statusResponse.ok) {
            throw new Error(
              statusData.message ||
                "Unable to load result-document statuses."
            );
          }

          (statusData.documents || []).forEach(
            (document) => {
              const enrollmentId = String(
                document.studentEnrollmentId
              );

              // The backend returns newest documents first.
              // Keep the newest document for each enrollment.
              if (!statusMap[enrollmentId]) {
                statusMap[enrollmentId] = document;
              }
            }
          );
        }

        setDocumentStatuses(statusMap);
      } catch (statusError) {
          setDocumentStatusesError(true);

        console.error(
          "Result document status lookup failed:",
          statusError
        );

        notify({
          title: "Document Status Unavailable",
          message:
            "Results loaded successfully, but authorization statuses could not be retrieved. You can retry by loading the results again.",
        });
      } finally {
        setDocumentStatusesLoading(false);
      }

    } catch (error) {
      setLoadedStudents([]);
      setLoadedSubjects([]);
      setSavedResults([]);
      setScoreEntries({});

      notify({
        title: "Unable to Load Results",
        message: error.message,
      });
    } finally {
      setResultsLoading(false);
    }
  };


  /* --------------------------------
      Save results
  -------------------------------- */



  const handleSaveResults = async () => {
    if (!resultsLoaded || resultsLoading) {
      notify({
        title: "Results Not Loaded",
        message:
          "Load the results for the selected class and term before saving.",
      });

      return;
    }

    if (!authToken) {
      notify({
        title: "Session Expired",
        message:
          "Please log in again before saving results.",
      });

      return;
    }

    let savedCount = 0;
    const failedResults = [];

    try {
      for (const student of loadedStudents) {
        const enrollment = getStudentEnrollment(
          student,
          selectedSessionId
        );

        if (!enrollment) {
          failedResults.push(
            `${student.firstName || "Student"}: enrollment not found`
          );
          continue;
        }

        const studentSubjects =
          getStudentSubjectsForEnrollment(
            student,
            enrollment
          );

        for (const subject of studentSubjects) {
          const entryKey = `${student.id}-${subject.id}`;
          const entry = scoreEntries[entryKey];

          if (!entry) {
            continue;
          }

          const ca = Number(entry.ca) || 0;
          const exam = Number(entry.exam) || 0;

          const existingResult = savedResults.find(
            (result) =>
              String(result.studentEnrollmentId) ===
                String(enrollment.id) &&
              String(result.academicTermId) ===
                String(selectedTermId) &&
              String(result.subjectId) === String(subject.id)
          );

          const isUpdate = Boolean(existingResult?.id);

          const response = await fetch(
            isUpdate
              ? `${API_BASE_URL}/results/${encodeURIComponent(existingResult.id)}`
              : `${API_BASE_URL}/results`,
            {
              method: isUpdate ? "PATCH" : "POST",
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(
                isUpdate
                  ? { ca, exam }
                  : {
                      studentEnrollmentId: enrollment.id,
                      termId: selectedTermId,
                      subjectId: subject.id,
                      ca,
                      exam,
                    }
              ),
            }
          );

          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            failedResults.push(
              `${student.firstName || "Student"} - ${subject.name}: ${
                data.message || "Save failed"
              }`
            );

            continue;
          }

          savedCount += 1;
        }
      }

      /*
        Reload the selected term from PostgreSQL so the UI
        reflects the actual persisted records and database IDs.
      */
      const refreshResponse = await fetch(
        `${API_BASE_URL}/results?termId=${encodeURIComponent(selectedTermId)}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const refreshData = await refreshResponse.json().catch(() => ({}));

      if (!refreshResponse.ok) {
        throw new Error(
          refreshData.message ||
            "Scores were processed, but saved results could not be refreshed."
        );
      }

      const matchingEnrollmentIds = new Set(
        loadedStudents
          .map((student) =>
            getStudentEnrollment(student, selectedSessionId)
          )
          .filter(Boolean)
          .map((enrollment) => String(enrollment.id))
      );

      const refreshedResults = (refreshData.results || [])
        .filter((result) =>
          matchingEnrollmentIds.has(
            String(result.student_enrollment_id)
          )
        )
        .map((result) => {
          const enrollment = enrollments.find(
            (item) =>
              String(item.id) ===
              String(result.student_enrollment_id)
          );

          return {
            id: result.id,
            studentId: result.student_id,
            studentEnrollmentId: result.student_enrollment_id,
            subjectId: result.subject_id,
            academicSessionId: enrollment?.academicSessionId,
            academicTermId: result.term_id,
            sectionId: enrollment?.sectionId,
            ca: result.ca,
            exam: result.exam,
            total: result.total,
            grade: result.grade,
            remark: result.remark,
          };
        });

      setSavedResults(refreshedResults);

      if (failedResults.length > 0) {
        notify({
          title: "Some Results Could Not Be Saved",
          message:
            `${savedCount} result(s) saved successfully. ` +
            `${failedResults.length} failed. ` +
            failedResults.slice(0, 3).join("; "),
        });

        return;
      }

      notify({
        title: "Results Saved",
        message:
          `${savedCount} result(s) saved successfully to the database.`,
      });
    } catch (error) {
      notify({
        title: "Unable to Complete Save",
        message: error.message,
      });
    }
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

  const studentSavedResults = savedResults.filter(
  (result) =>
    String(result.studentId) === String(student.id) &&
    String(result.academicSessionId) === String(selectedSessionId) &&
    String(result.academicTermId) === String(termId) &&
    String(result.sectionId) === String(enrollment.sectionId)
);

  if (studentSavedResults.length === 0) {
    return null;
  }

  let totalScore = 0;
  let subjectCount = 0;

  studentSubjects.forEach((subject) => {
    const result = studentSavedResults.find(
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
      Result document authorization
  -------------------------------- */

  const handleDownloadFinalizedResult = async (student) => {
    const enrollment = getStudentEnrollment(
      student,
      selectedSessionId
    );

    const enrollmentId = enrollment?.id
      ? String(enrollment.id)
      : "";

    const document = enrollmentId
      ? documentStatuses[enrollmentId]
      : null;

    if (!document?.documentId || document.status !== "finalized") {
      notify({
        title: "Result Not Finalized",
        message:
          "Only finalized result documents can be downloaded as official results.",
      });
      return;
    }

    if (!authToken) {
      notify({
        title: "Session Expired",
        message: "Please log in again.",
      });
      return;
    }

    setDocumentActionLoading((previousLoading) => ({
      ...previousLoading,
      [enrollmentId]: true,
    }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/results/documents/${encodeURIComponent(document.documentId)}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to retrieve the finalized result."
        );
      }

      if (data.document?.status !== "finalized") {
        throw new Error(
          "This result document has not been finalized."
        );
      }

    
      const resultDocument = data.document;
      const subjectResults = data.results || [];

      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const leftMargin = 20;
      const rightMargin = 20;
      const contentWidth = pageWidth - leftMargin - rightMargin;

      let y = 20;

      const addPageIfNeeded = (requiredSpace = 10) => {
        if (y + requiredSpace > pageHeight - 25) {
          doc.addPage();
          y = 20;
        }
      };

            const addText = (value, x, positionY, options = {}) => {
        const textValue =
          typeof value === "string" || Array.isArray(value)
            ? value
            : String(value ?? "—");

        doc.text(
          textValue,
          x,
          positionY,
          options
        );
      };

      const convertImageToPng = async (imageSource) => {
       
        if (!imageSource || typeof imageSource !== "string") {
          return null;
        }

        if (imageSource.startsWith("data:image/png")) {
          return imageSource;
        }

        return new Promise((resolve) => {
          const image = new Image();

          image.onload = () => {
            try {
              const canvas = window.document.createElement("canvas");

              canvas.width = image.naturalWidth;
              canvas.height = image.naturalHeight;

              if (!image.naturalWidth || !image.naturalHeight) {
              console.warn(
                "Finalized result PDF image has invalid dimensions."
              );
              resolve(null);
              return;
            }

              const context = canvas.getContext("2d");

              if (!context) {
                resolve(null);
                return;
              }

              context.drawImage(image, 0, 0);

              resolve(canvas.toDataURL("image/png"));
            } catch (error) {
              console.warn("Image conversion failed.", error);
              resolve(null);
            }
          };

            image.onerror = (error) => {
            console.warn(
              "Image could not be loaded for finalized result PDF.",
              {
                sourceType: imageSource.slice(0, 40),
                error,
              }
            );
            resolve(null);
          };
          image.src = imageSource;
        });
      };

            
      // Professional school letterhead
      const headerStartY = y;
      const logoX = leftMargin;
      const logoSize = 28;
      const schoolInfoX = logoX + logoSize + 8;
      const schoolInfoWidth = pageWidth - rightMargin - schoolInfoX;

      let logoRendered = false;

      if (resultDocument.school_logo_url) {
        const schoolLogo = await convertImageToPng(
          resultDocument.school_logo_url
        );

        if (schoolLogo) {
          try {
            doc.addImage(
              schoolLogo,
              "PNG",
              logoX,
              headerStartY,
              logoSize,
              logoSize
            );
            logoRendered = true;
          } catch (error) {
            console.warn("School logo could not be rendered.", error);
          }
        }
      }

      if (!logoRendered) {
        doc.setDrawColor(200, 210, 225);
        doc.setFillColor(248, 250, 252);
        doc.rect(logoX, headerStartY, logoSize, logoSize, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(120, 130, 145);
        addText("LOGO", logoX + logoSize / 2, headerStartY + 16, {
          align: "center",
        });
      }

      let schoolTextY = headerStartY + 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(25, 45, 75);

      const schoolNameLines = doc.splitTextToSize(
        resultDocument.school_name || "School Name",
        schoolInfoWidth
      );

      addText(schoolNameLines, schoolInfoX, schoolTextY);
      schoolTextY += schoolNameLines.length * 7;

      if (resultDocument.school_motto) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(90, 100, 115);

        addText(
          doc.splitTextToSize(resultDocument.school_motto, schoolInfoWidth),
          schoolInfoX,
          schoolTextY
        );

        schoolTextY += 6;
      }

      const schoolContactParts = [];

      if (resultDocument.school_address) {
        schoolContactParts.push(resultDocument.school_address);
      }

      if (resultDocument.school_phone) {
        schoolContactParts.push(resultDocument.school_phone);
      }

      if (resultDocument.school_email) {
        schoolContactParts.push(resultDocument.school_email);
      }

      if (resultDocument.school_website) {
        schoolContactParts.push(resultDocument.school_website);
      }

      if (schoolContactParts.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(80, 90, 105);

        const contactLines = doc.splitTextToSize(
          schoolContactParts.join(" | "),
          schoolInfoWidth
        );

        addText(contactLines, schoolInfoX, schoolTextY);
        schoolTextY += contactLines.length * 4.5;
      }

      y = Math.max(
        headerStartY + logoSize,
        schoolTextY
      ) + 5;

      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.7);
      doc.line(leftMargin, y, pageWidth - rightMargin, y);
      y += 9;

      // Official document heading
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(25, 45, 75);

      addText("OFFICIAL STUDENT RESULT", pageWidth / 2, y, {
        align: "center",
      });

      y += 10;

      // Student and academic information panel
        const studentDetails = [
        ["Student", resultDocument.student_name],
        ["Admission Number", resultDocument.admission_number],
        ["Gender", resultDocument.gender],
        ["Academic Session", resultDocument.academic_session_name],
        ["Term", resultDocument.term_name],
        ["Academic Level", resultDocument.academic_level_name],
        
       [
          "Class / Arm",
          resultDocument.section_name
            ? `${resultDocument.class_name || ""} ${resultDocument.section_name}`.trim()
            : resultDocument.class_name,
        ],
        ["Stream", resultDocument.stream_name],
        ["Subject Combination", resultDocument.subject_combination_name],
      ];

      const availableStudentDetails = studentDetails.filter(
        ([, value]) =>
          value !== null &&
          value !== undefined &&
          value !== ""
      );

      const detailColumnGap = 8;
      const detailColumnWidth =
        (contentWidth - detailColumnGap) / 2;

      const detailColumnX = [
        leftMargin,
        leftMargin + detailColumnWidth + detailColumnGap,
      ];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(45, 60, 80);
      addText("STUDENT INFORMATION", leftMargin, y);

      y += 5;

      for (
        let index = 0;
        index < availableStudentDetails.length;
        index += 2
      ) {
        const leftEntry = availableStudentDetails[index];
        const rightEntry = availableStudentDetails[index + 1];

        const leftValueLines = doc.splitTextToSize(
          String(leftEntry[1]),
          detailColumnWidth - 7
        );

        const rightValueLines = rightEntry
          ? doc.splitTextToSize(
              String(rightEntry[1]),
              detailColumnWidth - 7
            )
          : [];

        const maximumValueLines = Math.max(
          leftValueLines.length,
          rightValueLines.length
        );

        const rowHeight = Math.max(
          14,
          9 + maximumValueLines * 4
        );

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(220, 226, 235);
        doc.setLineWidth(0.2);

        doc.rect(
          leftMargin,
          y,
          contentWidth,
          rowHeight,
          "FD"
        );

        doc.line(
          leftMargin + detailColumnWidth + detailColumnGap / 2,
          y,
          leftMargin + detailColumnWidth + detailColumnGap / 2,
          y + rowHeight
        );

        const detailEntries = [
          { entry: leftEntry, x: detailColumnX[0], lines: leftValueLines },
          { entry: rightEntry, x: detailColumnX[1], lines: rightValueLines },
        ];

        detailEntries.forEach(({ entry, x, lines }) => {
          if (!entry) return;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(105, 115, 130);

          addText(entry[0], x + 3, y + 4);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(35, 45, 60);

          addText(lines, x + 3, y + 9);
        });

        y += rowHeight;
      }

      y += 8;


      // Professional subject results table
      addPageIfNeeded(30);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(35, 45, 60);
      addText("SUBJECT RESULTS", leftMargin, y);
      y += 8;

      const columns = [
        { title: "Subject", x: 20, width: 52 },
        { title: "CA", x: 73, width: 17 },
        { title: "Exam", x: 91, width: 20 },
        { title: "Total", x: 112, width: 20 },
        { title: "Grade", x: 133, width: 20 },
        { title: "Remark", x: 154, width: 36 },
      ];

      const drawTableHeader = () => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(30, 58, 95);
        doc.setDrawColor(30, 58, 95);

        doc.rect(
          leftMargin,
          y - 5,
          contentWidth,
          9,
          "FD"
        );

        columns.forEach((column, index) => {
          const isSubject = index === 0;
          const isRemark = index === 5;

          addText(
            column.title,
            isSubject
              ? column.x + 2
              : isRemark
                ? column.x + column.width - 2
                : column.x + column.width / 2,
            y,
            {
              align: isSubject
                ? "left"
                : isRemark
                  ? "right"
                  : "center",
            }
          );
        });

        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(35, 45, 60);
      };

      drawTableHeader();

      subjectResults.forEach((subject, index) => {
        const applicable = subject.is_applicable === true;
        const hasResult = subject.has_result === true;

        const subjectName = subject.subject_name || "—";
        const ca = applicable && hasResult ? subject.ca : "—";
        const exam = applicable && hasResult ? subject.exam : "—";
        const total = applicable && hasResult ? subject.total : "—";

        const grade = applicable && hasResult
          ? subject.grade
          : applicable
            ? "—"
            : "N/A";

        const remark = applicable && hasResult
          ? subject.remark
          : applicable
            ? "Pending"
            : "Not Applicable";

        const subjectLines = doc.splitTextToSize(
          subjectName,
          49
        );

        const remarkLines = doc.splitTextToSize(
          String(remark || "—"),
          33
        );

        const rowHeight = Math.max(
          8,
          Math.max(
            subjectLines.length,
            remarkLines.length
          ) * 4 + 3
        );

        const previousPage = doc.internal.getNumberOfPages();

        addPageIfNeeded(rowHeight + 5);

        if (doc.internal.getNumberOfPages() > previousPage) {
          drawTableHeader();
        }

        doc.setFillColor(
          index % 2 === 0 ? 248 : 255,
          index % 2 === 0 ? 250 : 255,
          index % 2 === 0 ? 253 : 255
        );

        doc.setDrawColor(220, 226, 235);
        doc.setLineWidth(0.2);

        doc.rect(
          leftMargin,
          y - 5,
          contentWidth,
          rowHeight,
          "FD"
        );

        // Subtle vertical column separators
        [72, 90, 111, 132, 153].forEach((position) => {
          doc.line(
            position,
            y - 5,
            position,
            y - 5 + rowHeight
          );
        });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(45, 55, 70);

        addText(
          subjectLines,
          columns[0].x + 2,
          y
        );

        addText(
          ca,
          columns[1].x + columns[1].width / 2,
          y,
          { align: "center" }
        );

        addText(
          exam,
          columns[2].x + columns[2].width / 2,
          y,
          { align: "center" }
        );

        addText(
          total,
          columns[3].x + columns[3].width / 2,
          y,
          { align: "center" }
        );

        doc.setFont("helvetica", "bold");

        addText(
          grade,
          columns[4].x + columns[4].width / 2,
          y,
          { align: "center" }
        );

        doc.setFont("helvetica", "normal");

        addText(
          remarkLines,
          columns[5].x + columns[5].width - 2,
          y,
          { align: "right" }
        );

        y += rowHeight;
      });


      
      // Professional finalized result summary
      const hasSessionSummary =
        resultDocument.session_average !== null &&
        resultDocument.session_average !== undefined;

      const summaryRequiredHeight = hasSessionSummary ? 115 : 90;

      addPageIfNeeded(summaryRequiredHeight);
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(35, 45, 60);
      addText("FINAL RESULT SUMMARY", leftMargin, y);
      y += 10;

      const attendancePercentage =
        resultDocument.attendance_percentage !== null &&
        resultDocument.attendance_percentage !== undefined
          ? `${resultDocument.attendance_percentage}%`
          : "—";

      const formatFinalizedPosition = (position, total) => {
        if (
          position === null ||
          position === undefined ||
          total === null ||
          total === undefined
        ) {
          return "—";
        }

        return `${formatPosition(Number(position))} of ${Number(total)}`;
      };

      const summaryCards = [
        {
          label: "TOTAL SCORE",
          value: resultDocument.term_total_score ?? "—",
        },
        {
          label: "AVERAGE",
          value:
            resultDocument.term_average !== null &&
            resultDocument.term_average !== undefined
              ? `${resultDocument.term_average}%`
              : "—",
        },
        {
          label: "GRADE",
          value: resultDocument.term_grade ?? "—",
        },
        {
          label: "REMARK",
          value: resultDocument.term_remark ?? "—",
        },
        {
          label: "CLASS POSITION",
          value: formatFinalizedPosition(
            resultDocument.class_position,
            resultDocument.class_position_total
          ),
        },
        {
          label: "LEVEL POSITION",
          value: formatFinalizedPosition(
            resultDocument.academic_level_position,
            resultDocument.academic_level_position_total
          ),
        },
        {
          label: "ATTENDANCE PRESENT",
          value: resultDocument.attendance_present ?? "—",
        },
        {
          label: "ATTENDANCE ABSENT",
          value: resultDocument.attendance_absent ?? "—",
        },
        {
          label: "ATTENDANCE",
          value: attendancePercentage,
        },
      ];

      const summaryColumnGap = 4;
      const summaryCardWidth =
        (contentWidth - summaryColumnGap * 2) / 3;
      const summaryCardHeight = 21;

      summaryCards.forEach((card, index) => {
        const columnIndex = index % 3;
        const rowIndex = Math.floor(index / 3);

        const cardX =
          leftMargin +
          columnIndex * (summaryCardWidth + summaryColumnGap);

        const cardY = y + rowIndex * (summaryCardHeight + 3);

        doc.setFillColor(248, 250, 253);
        doc.setDrawColor(220, 226, 235);
        doc.setLineWidth(0.25);

        doc.rect(
          cardX,
          cardY,
          summaryCardWidth,
          summaryCardHeight,
          "FD"
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(105, 115, 130);

        addText(
          card.label,
          cardX + 3,
          cardY + 6
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(35, 55, 85);

        const cardValueLines = doc.splitTextToSize(
          String(card.value),
          summaryCardWidth - 6
        );

        addText(
          cardValueLines.slice(0, 2),
          cardX + 3,
          cardY + 14
        );
      });

      y += summaryCardHeight * 3 + 6;

      if (hasSessionSummary) {
        const sessionCardGap = 4;
        const sessionCardWidth =
          (contentWidth - sessionCardGap) / 2;
        const sessionCardHeight = 20;

        const sessionCards = [
          {
            label: "SESSION AVERAGE",
            value: `${resultDocument.session_average}%`,
          },
          {
            label: "SESSION LEVEL POSITION",
            value: formatFinalizedPosition(
              resultDocument.session_academic_level_position,
              resultDocument.session_academic_level_position_total
            ),
          },
        ];

        sessionCards.forEach((card, index) => {
          const cardX =
            leftMargin +
            index * (sessionCardWidth + sessionCardGap);

          doc.setFillColor(240, 246, 255);
          doc.setDrawColor(190, 210, 235);
          doc.setLineWidth(0.25);

          doc.rect(
            cardX,
            y,
            sessionCardWidth,
            sessionCardHeight,
            "FD"
          );

          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          doc.setTextColor(75, 95, 120);

          addText(
            card.label,
            cardX + 3,
            y + 6
          );

          doc.setFontSize(10);
          doc.setTextColor(35, 55, 85);

          addText(
            String(card.value),
            cardX + 3,
            y + 15
          );
        });

        y += sessionCardHeight + 3;
      }

      y += 5;


      // Saved official authorization snapshot
      addPageIfNeeded(80);
      y += 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      addText("AUTHORIZED OFFICIALS", leftMargin, y);
      y += 10;

            const drawOfficial = async (official, x) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        addText(official.name, x, y);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        addText(official.title, x, y + 6);

        if (official.signature) {
          const signature = await convertImageToPng(
            official.signature
          );

          if (signature) {
            try {
              doc.addImage(signature, "PNG", x, y + 9, 65, 16);
            } catch (error) {
              console.warn("Official signature could not be rendered.", error);
            }
          }
        }

        doc.line(x, y + 30, x + 65, y + 30);

        if (official.stamp) {
          const stamp = await convertImageToPng(official.stamp);

          if (stamp) {
            try {
              doc.addImage(stamp, "PNG", x + 42, y + 32, 22, 22);
            } catch (error) {
              console.warn("Official stamp could not be rendered.", error);
            }
          }
        }

        doc.setFontSize(7);
        addText("Signature / Stamp", x, y + 36);
      };

        await  drawOfficial(
        {
          name: resultDocument.exam_officer_name,
          title: resultDocument.exam_officer_title,
          signature: resultDocument.exam_officer_signature_url,
          stamp: resultDocument.exam_officer_stamp_url,
        },
        25
      );

      await  drawOfficial(
        {
          name: resultDocument.principal_name,
          title: resultDocument.principal_title,
          signature: resultDocument.principal_signature_url,
          stamp: resultDocument.principal_stamp_url,
        },
        110
      );

      // Footer and page numbering
      const totalPages = doc.internal.getNumberOfPages();
      const finalizedDate = resultDocument.finalized_at
        ? new Date(resultDocument.finalized_at).toLocaleDateString("en-GB")
        : "—";

      for (let page = 1; page <= totalPages; page++) {
        doc.setPage(page);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);

        addText(
          `Finalized: ${finalizedDate}`,
          leftMargin,
          pageHeight - 12
        );

        addText(
          `Page ${page} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 12,
          { align: "center" }
        );

        addText(
          "Powered by WeMoren Web Services",
          pageWidth - rightMargin,
          pageHeight - 12,
          { align: "right" }
        );

        doc.setTextColor(0, 0, 0);
      }

      const fileName = (resultDocument.student_name || "Student")
        .trim()
        .replace(/\s+/g, "-");

      doc.save(`${fileName}-Finalized-Result.pdf`);

      notify({
        title: "Finalized Result Downloaded",
        message:
          "The official result document was generated from its finalized database snapshot.",
      });
    } catch (error) {
      notify({
        title: "Download Failed",
        message: error.message,
      });
    } finally {
      setDocumentActionLoading((previousLoading) => ({
        ...previousLoading,
        [enrollmentId]: false,
      }));
    }
  };


  const refreshDocumentStatus = async (
    enrollmentId,
    termId = selectedTermId
  ) => {
    const response = await fetch(
      `${API_BASE_URL}/results/documents/lookup?termId=${encodeURIComponent(termId)}&studentEnrollmentIds=${encodeURIComponent(enrollmentId)}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to refresh result-document status."
      );
    }

    const latestDocument = data.documents?.[0];

    setDocumentStatuses((previousStatuses) => {
      const updatedStatuses = {
        ...previousStatuses,
      };

      if (latestDocument) {
        updatedStatuses[enrollmentId] = latestDocument;
      } else {
        delete updatedStatuses[enrollmentId];
      }

      return updatedStatuses;
    });
  };

  const handleResultDocumentAction = async (
    student,
    action
  ) => {
    const enrollment = getStudentEnrollment(
      student,
      selectedSessionId
    );

    if (!enrollment?.id) {
      notify({
        title: "Enrollment Not Found",
        message:
          "This student does not have a valid enrollment for the selected academic session.",
      });

      return;
    }

    if (!selectedTermId) {
      notify({
        title: "Term Required",
        message:
          "Select an academic term before managing result documents.",
      });

      return;
    }

    if (!authToken) {
      notify({
        title: "Session Expired",
        message:
          "Please log in again before managing result documents.",
      });

      return;
    }

    if (!canManageResultDocuments) {
      notify({
        title: "Access Denied",
        message:
          "Only the Principal or Exam Officer can manage result-document authorization.",
      });

      return;
    }

    const enrollmentId = String(enrollment.id);
    const existingDocument =
      documentStatuses[enrollmentId];

    let endpoint = "";
    let requestBody;
    let method = "POST";

    if (action === "create") {
      if (existingDocument?.documentId) {
        notify({
          title: "Document Already Exists",
          message:
            "A result document already exists for this student and term. Refresh its status before continuing.",
        });

        return;
      }

      endpoint = `${API_BASE_URL}/results/documents`;

      requestBody = {
        studentEnrollmentId: enrollmentId,
        termId: selectedTermId,
      };
    } else {
      if (!existingDocument?.documentId) {
        notify({
          title: "Document Not Found",
          message:
            "Create the result document before attempting authorization or finalization.",
        });

        return;
      }

      const documentId = existingDocument.documentId;

      if (action === "principal") {
        if (!canAuthorizeAsPrincipal) {
          return;
        }

        endpoint = `${API_BASE_URL}/results/documents/${documentId}/authorize/principal`;
      } else if (action === "exam-officer") {
        if (!canAuthorizeAsExamOfficer) {
          return;
        }

        endpoint = `${API_BASE_URL}/results/documents/${documentId}/authorize/exam-officer`;
      } else if (action === "finalize") {
        if (
          !existingDocument.principalAuthorizedAt ||
          !existingDocument.examOfficerAuthorizedAt
        ) {
          notify({
            title: "Authorization Incomplete",
            message:
              "Both Principal and Exam Officer authorization must be completed before finalization.",
          });

          return;
        }

        endpoint = `${API_BASE_URL}/results/documents/${documentId}/finalize`;
      } else {
        return;
      }
    }

    setDocumentActionLoading((previousLoading) => ({
      ...previousLoading,
      [enrollmentId]: true,
    }));

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        ...(requestBody
          ? {
              body: JSON.stringify(requestBody),
            }
          : {}),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "The result-document action could not be completed."
        );
      }

      notify({
        title: "Result Document Updated",
        message:
          data.message ||
          "The result-document action was completed successfully.",
      });

      try {
        await refreshDocumentStatus(enrollmentId);
      } catch (statusError) {
        console.error(
          "Failed to refresh result-document status:",
          statusError
        );

        notify({
          title: "Status Refresh Failed",
          message:
            "The action succeeded, but the displayed document status could not be refreshed. Reload the results to retrieve the latest status.",
        });
      }
    } catch (error) {
      notify({
        title: "Result Document Action Failed",
        message: error.message,
      });
    } finally {
      setDocumentActionLoading((previousLoading) => ({
        ...previousLoading,
        [enrollmentId]: false,
      }));
    }
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
        schoolProfile.name || "School",
        105,
        y,
        {
          align: "center",
        }
      );

      y += 7;

      if (schoolProfile.motto) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);

        const mottoLines = doc.splitTextToSize(
          schoolProfile.motto,
          170
        );

        doc.text(
          mottoLines,
          105,
          y,
          {
            align: "center",
          }
        );

        y += mottoLines.length * 5 + 2;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      if (schoolProfile.address) {
        const addressLines = doc.splitTextToSize(
          schoolProfile.address,
          170
        );

        doc.text(
          addressLines,
          105,
          y,
          {
            align: "center",
          }
        );

        y += addressLines.length * 5 + 2;
      }

      const contactDetails = [];

      if (schoolProfile.phone) {
        contactDetails.push(schoolProfile.phone);
      }

      if (schoolProfile.email) {
        contactDetails.push(schoolProfile.email);
      }

      if (schoolProfile.website) {
        contactDetails.push(schoolProfile.website);
      }

      const contactInfo = contactDetails.join(" | ");

      if (contactInfo) {
        const contactLines = doc.splitTextToSize(
          contactInfo,
          170
        );

        doc.text(
          contactLines,
          105,
          y,
          {
            align: "center",
          }
        );

        y += contactLines.length * 5 + 6;
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

                  const enrollment =
                    getStudentEnrollment(
                      student,
                      selectedSessionId
                    );

                  const enrollmentId =
                    enrollment?.id
                      ? String(enrollment.id)
                      : "";

                  const document =
                    enrollmentId
                      ? documentStatuses[enrollmentId]
                      : null;

                  const actionLoading =
                    enrollmentId
                      ? Boolean(
                          documentActionLoading[enrollmentId]
                        )
                      : false;

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

                      <div className="results-document-controls">
                        <strong>
                          Result Document Authorization
                        </strong>

                        {documentStatusesLoading ? (
                          <span>
                            Loading document status...
                          </span>
                        ) : documentStatusesError ? (
                          <span>
                            Document status unavailable. Reload results before managing authorization.
                          </span>
                        ) : !enrollmentId ? (
                          <span>
                            No enrollment found for this session.
                          </span>
                        ) : !document ? (
                          <span>
                            No result document created.
                          </span>
                        ) : (
                          <>
                            <span>
                              Document Status:{" "}
                              {document.status === "finalized"
                                ? "Finalized"
                                : "Draft"}
                            </span>

                            <span>
                              Principal Authorization:{" "}
                              {document.principalAuthorizedAt
                                ? "Complete"
                                : "Pending"}
                            </span>

                            <span>
                              Exam Officer Authorization:{" "}
                              {document.examOfficerAuthorizedAt
                                ? "Complete"
                                : "Pending"}
                            </span>
                          </>
                        )}

                        {canManageResultDocuments &&
                          enrollmentId &&
                          !document &&
                          !documentStatusesLoading && 
                           !documentStatusesError && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() =>
                                handleResultDocumentAction(
                                  student,
                                  "create"
                                )
                              }
                            >
                              {actionLoading
                                ? "Creating..."
                                : "Create Result Draft"}
                            </button>
                          )}

                        {document &&
                          document.status === "draft" && (
                            <>
                              {canAuthorizeAsPrincipal &&
                                !document.principalAuthorizedAt && (
                                  <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      handleResultDocumentAction(
                                        student,
                                        "principal"
                                      )
                                    }
                                  >
                                    {actionLoading
                                      ? "Processing..."
                                      : "Authorize as Principal"}
                                  </button>
                                )}

                              {canAuthorizeAsExamOfficer &&
                                !document.examOfficerAuthorizedAt && (
                                  <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      handleResultDocumentAction(
                                        student,
                                        "exam-officer"
                                      )
                                    }
                                  >
                                    {actionLoading
                                      ? "Processing..."
                                      : currentUserRoles.includes("Principal")
                                      ? "Authorize as Exam Officer"
                                      : "Authorize as Exam Officer"}
                                  </button>
                                )}

                              {document.principalAuthorizedAt &&
                                document.examOfficerAuthorizedAt &&
                                canManageResultDocuments && (
                                  <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() =>
                                      handleResultDocumentAction(
                                        student,
                                        "finalize"
                                      )
                                    }
                                  >
                                    {actionLoading
                                      ? "Finalizing..."
                                      : "Finalize Result"}
                                  </button>
                                )}
                            </>
                          )}

                        {document?.status === "finalized" && (
                          <strong>
                            Result document finalized successfully.
                          </strong>
                        )}
                      </div>

                                            {document?.status === "finalized" && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            handleDownloadFinalizedResult(student)
                          }
                        >
                          {actionLoading
                            ? "Preparing Official Result..."
                            : "Download Finalized Result"}
                        </button>
                      )}

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