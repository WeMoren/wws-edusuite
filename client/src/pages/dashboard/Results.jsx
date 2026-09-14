import React, { useState } from "react";
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

  const [assessmentSettings] = useState(() => {
    const savedAssessment =
      localStorage.getItem("assessmentSettings");

    if (savedAssessment) {
      return JSON.parse(savedAssessment);
    }

    return {
      caMax: 30,
      examMax: 70,
    };
  });

  const [gradingScale] = useState(() => {
    const savedGradingScale =
      localStorage.getItem("gradingScale");

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

  const notify = ({ title, message }) => {
    setNotification({
      title,
      message,
    });

    setShowNotification(true);
  };

  /* --------------------------------
      Academic helpers
  -------------------------------- */

  const getStudentEnrollment = (
    student,
    sessionId = Number(selectedSessionId)
  ) => {
    return enrollments.find(
      (enrollment) =>
        enrollment.studentId === student.id &&
        enrollment.academicSessionId === Number(sessionId)
    );
  };

  const getEnrollmentForSection = (
    student,
    sectionId,
    sessionId = Number(selectedSessionId)
  ) => {
    return enrollments.find(
      (enrollment) =>
        enrollment.studentId === student.id &&
        enrollment.academicSessionId === Number(sessionId) &&
        enrollment.sectionId === Number(sectionId)
    );
  };

  const getStudentAcademicContext = (student) => {
    const enrollment = getStudentEnrollment(student);

    if (!enrollment) {
      return null;
    }

    const section = sections.find(
      (item) => item.id === Number(enrollment.sectionId)
    );

    if (!section) {
      return null;
    }

    const classItem = classes.find(
      (item) =>
        item.id === Number(section.classId) &&
        item.academicSessionId === Number(selectedSessionId)
    );

    if (!classItem) {
      return null;
    }

    const academicLevel = academicLevels.find(
      (item) =>
        item.id === Number(classItem.academicLevelId)
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
    const context =
      getStudentAcademicContext(student);

    if (!context) {
      return {
        present: 0,
        absent: 0,
        totalMarked: 0,
        percentage: null,
      };
    }

    const { classItem } = context;

    const attendanceRecords = (
      attendance || []
    ).filter(
      (record) =>
        record.studentId === student.id &&
        record.academicSessionId ===
          Number(selectedSessionId) &&
        record.academicTermId ===
          Number(termId) &&
        record.classId ===
          Number(classItem.id)
    );

    const present =
      attendanceRecords.filter(
        (record) =>
          record.status === "present"
      ).length;

    const absent =
      attendanceRecords.filter(
        (record) =>
          record.status === "absent"
      ).length;

    const totalMarked =
      present + absent;

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
      (item) =>
        item.id === Number(enrollment.sectionId)
    );

    if (!section) {
      return [];
    }

    const classItem = classes.find(
      (item) =>
        item.id === Number(section.classId) &&
        item.academicSessionId ===
          Number(selectedSessionId)
    );

    if (!classItem) {
      return [];
    }

    const level = academicLevels.find(
      (item) =>
        item.id === Number(classItem.academicLevelId)
    );

    if (!level) {
      return [];
    }

    const levelSubjects = subjects.filter((subject) =>
      subject.academicLevelIds?.some(
        (levelId) =>
          Number(levelId) === Number(level.id)
      )
    );

    /*
      SS1 remains level-wide.

      SS2 and SS3 must use the student's
      Science / Arts / Commercial combination.
    */
    const requiresCombination =
      level.name === "SS 2" ||
      level.name === "SS 3";

    if (!requiresCombination) {
      return levelSubjects;
    }

    if (!enrollment.combinationId) {
      return [];
    }

    const combination =
      subjectCombinations.find(
        (item) =>
          Number(item.id) ===
          Number(enrollment.combinationId)
      );

    if (!combination) {
      return [];
    }

    return levelSubjects.filter((subject) =>
      combination.subjectIds?.some(
        (subjectId) =>
          Number(subjectId) ===
          Number(subject.id)
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

    const sessionId = Number(selectedSessionId);
    const classId = Number(selectedClassId);
    const sectionId = Number(selectedSectionId);
    const termId = Number(selectedTermId);

    const selectedClass = classes.find(
      (classItem) =>
        classItem.id === classId &&
        classItem.academicSessionId === sessionId
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
          enrollment.academicSessionId === sessionId &&
          enrollment.sectionId === sectionId
      )
      .map((enrollment) => enrollment.studentId);

    const matchingStudents = students.filter((student) =>
      studentIds.includes(student.id)
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
          Number(levelId) ===
          Number(selectedClass.academicLevelId)
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
        Number(selectedSessionId)
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
        result.academicSessionId ===
          Number(selectedSessionId) &&
        result.academicTermId ===
          Number(selectedTermId) &&
        result.sectionId ===
          Number(selectedSectionId);

      if (!isSameResultPeriod) {
        return true;
      }

      return studentSubjects.some(
        (subject) =>
          Number(subject.id) ===
          Number(result.subjectId)
      );
    });

    loadedStudents.forEach((student) => {
      const enrollment =
        getStudentEnrollment(
          student,
          Number(selectedSessionId)
        );

      const studentSubjects =
        getStudentSubjectsForEnrollment(
          student,
          enrollment
        );

      studentSubjects.forEach((subject) => {
        const entryKey =
          `${student.id}-${subject.id}`;

        const entry =
          scoreEntries[entryKey];

        if (!entry) {
          return;
        }

        const ca = Number(entry.ca) || 0;
        const exam = Number(entry.exam) || 0;

        const existingIndex =
          updatedResults.findIndex(
            (result) =>
              result.studentId === student.id &&
              result.subjectId === subject.id &&
              result.academicSessionId ===
                Number(selectedSessionId) &&
              result.academicTermId ===
                Number(selectedTermId) &&
              result.sectionId ===
                Number(selectedSectionId)
          );

        const resultData = {
          studentId: student.id,
          subjectId: subject.id,
          academicSessionId:
            Number(selectedSessionId),
          academicTermId:
            Number(selectedTermId),
          sectionId:
            Number(selectedSectionId),
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
            id:
              Date.now() +
              updatedResults.length,
            ...resultData,
          });
        }
      });
    });

    setResults(updatedResults);

    notify({
      title: "Results Saved",
      message:
        "Student results have been saved successfully.",
    });
  };

  /* --------------------------------
      Result calculations
  -------------------------------- */

  const getStudentTermAverage = (
    student,
    termId
  ) => {
    const enrollment =
      getStudentEnrollment(
        student,
        Number(selectedSessionId)
      );

    if (!enrollment) {
      return null;
    }

    const studentSubjects =
      getStudentSubjectsForEnrollment(
        student,
        enrollment
      );

    if (studentSubjects.length === 0) {
      return null;
    }

    const savedResults =
      results.filter(
        (result) =>
          result.studentId === student.id &&
          result.academicSessionId ===
            Number(selectedSessionId) &&
          result.academicTermId ===
            Number(termId) &&
          result.sectionId ===
            Number(enrollment.sectionId)
      );

    if (savedResults.length === 0) {
      return null;
    }

    let totalScore = 0;
    let subjectCount = 0;

    studentSubjects.forEach(
      (subject) => {
        const result =
          savedResults.find(
            (item) =>
              Number(item.subjectId) ===
              Number(subject.id)
          );

        if (!result) {
          return;
        }

        const ca =
          Number(result.ca) || 0;

        const exam =
          Number(result.exam) || 0;

        totalScore += ca + exam;
        subjectCount += 1;
      }
    );

    if (subjectCount === 0) {
      return null;
    }

    return (
      totalScore /
      subjectCount
    );
  };

  const getSessionTermIds = () => {
    return academicTerms
      .filter(
        (term) =>
          term.academicSessionId ===
          Number(selectedSessionId)
      )
      .sort((a, b) => a.id - b.id)
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

  const getStudentPositions = (
    student
  ) => {
    const context =
      getStudentAcademicContext(
        student
      );

    if (!context) {
      return {
        classPositionLabel: "—",
        academicLevelPositionLabel:
          "—",
        sessionAcademicLevelPositionLabel:
          "—",
        classTotal: 0,
        academicLevelTotal: 0,
        sessionAcademicLevelTotal: 0,
        termAverage: null,
        sessionAverage: null,
      };
    }

    const {
      classItem,
      academicLevel,
    } = context;

    const sessionId =
      Number(selectedSessionId);

    const enrolledStudents =
      students.filter((item) =>
        enrollments.some(
          (enrollment) =>
            enrollment.studentId ===
              item.id &&
            enrollment.academicSessionId ===
              sessionId &&
            enrollment.sectionId
        )
      );

    const classStudents =
      enrolledStudents.filter(
        (item) => {
          const itemContext =
            getStudentAcademicContext(
              item
            );

          return (
            itemContext?.classItem?.id ===
            classItem.id
          );
        }
      );

    const academicLevelStudents =
      enrolledStudents.filter(
        (item) => {
          const itemContext =
            getStudentAcademicContext(
              item
            );

          return (
            itemContext?.academicLevel
              ?.id ===
            academicLevel.id
          );
        }
      );

    const currentTermAverage =
      getStudentTermAverage(
        student,
        Number(selectedTermId)
      );

    const classPosition =
      getCompetitionPosition(
        classStudents,
        student,
        (item) =>
          getStudentTermAverage(
            item,
            Number(selectedTermId)
          )
      );

    const academicLevelPosition =
      getCompetitionPosition(
        academicLevelStudents,
        student,
        (item) =>
          getStudentTermAverage(
            item,
            Number(selectedTermId)
          )
      );

    let sessionAcademicLevelPosition =
      null;

    let sessionAverage = null;

    if (
      Number(selectedTermId) ===
      getSessionTermIds()[2]
    ) {
      sessionAverage =
        getStudentSessionAverage(
          student
        );

      sessionAcademicLevelPosition =
        getCompetitionPosition(
          academicLevelStudents,
          student,
          (item) =>
            getStudentSessionAverage(
              item
            )
        );
    }

    return {
      classPosition:
        classPosition?.position ||
        null,

      classPositionLabel:
        classPosition
          ? `${formatPosition(
              classPosition.position
            )} of ${
              classPosition.total
            }`
          : "—",

      classTotal:
        classPosition?.total || 0,

      academicLevelPosition:
        academicLevelPosition
          ?.position || null,

      academicLevelPositionLabel:
        academicLevelPosition
          ? `${formatPosition(
              academicLevelPosition.position
            )} of ${
              academicLevelPosition.total
            }`
          : "—",

      academicLevelTotal:
        academicLevelPosition?.total ||
        0,

      sessionAcademicLevelPosition:
        sessionAcademicLevelPosition
          ?.position || null,

      sessionAcademicLevelPositionLabel:
        sessionAcademicLevelPosition
          ? `${formatPosition(
              sessionAcademicLevelPosition.position
            )} of ${
              sessionAcademicLevelPosition.total
            }`
          : "—",

      sessionAcademicLevelTotal:
        sessionAcademicLevelPosition
          ?.total || 0,

      termAverage:
        currentTermAverage,

      sessionAverage,
    };
  };

  /* --------------------------------
      Student result data
  -------------------------------- */

  const getStudentResultData = (
    student
  ) => {
    const enrollment =
      getStudentEnrollment(
        student,
        Number(selectedSessionId)
      );

    const studentSubjects =
      getStudentSubjectsForEnrollment(
        student,
        enrollment
      );

    const studentResults =
      studentSubjects.map(
        (subject) => {
          const entryKey =
            `${student.id}-${subject.id}`;

          const entry =
            scoreEntries[entryKey] || {
              ca: 0,
              exam: 0,
            };

            /*
              A subject that is not part of
              this student's combination must
              not participate in result entry,
              grading, totals, or averages.
            */
           


          const ca =
            Number(entry.ca) || 0;

          const exam =
            Number(entry.exam) || 0;

          const total = ca + exam;

          const grading =
            gradingScale.find(
              (item) =>
                total >= item.min &&
                total <= item.max
            );

          return {
            subjectId: subject.id,
            subject: subject.name,
            ca,
            exam,
            total,
            grade:
              grading?.grade || "-",
            remark:
              grading?.remark || "-",
          };
        }
      );

    const positions =
      getStudentPositions(
        student
      );

    const attendanceStats =
      getStudentAttendanceStats(
        student,
        Number(selectedTermId)
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

  const handleDownloadResult = (
    student
  ) => {
    const resultData =
      getStudentResultData(
        student
      );


      /* number of subjects offered by student */

      const enrollment =
         getStudentEnrollment(
        student,
        Number(selectedSessionId)
      );

      const studentStream = streams.find(
        (stream) =>
          Number(stream.id) ===
          Number(enrollment?.streamId)
      );

      const studentSubjects =
        getStudentSubjectsForEnrollment(
          student,
          enrollment
        );

      const totalSubjectsOffered =
        studentSubjects.length;

      const studentSubjectIds =
        studentSubjects.map(
          (subject) => subject.id
        );
     


    const attendanceStats =
      resultData.attendanceStats || {
        present: 0,
        absent: 0,
        totalMarked: 0,
        percentage: null,
      };

    const savedProfile =
      localStorage.getItem(
        "schoolProfile"
      );

    const schoolProfile =
      savedProfile
        ? JSON.parse(savedProfile)
        : {
            name: "",
            address: "",
            phone: "",
            email: "",
            logo: "",
          };

    const selectedSession =
      academicSessions.find(
        (session) =>
          session.id ===
          Number(selectedSessionId)
      );

    const selectedTerm =
      academicTerms.find(
        (term) =>
          term.id ===
          Number(selectedTermId)
      );

    const selectedClass =
      classes.find(
        (classItem) =>
          classItem.id ===
          Number(selectedClassId)
      );

    const selectedSection =
      sections.find(
        (section) =>
          section.id ===
          Number(selectedSectionId)
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
    const infoHeight = 46;

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
      infoX,
      infoY,
      infoWidth,
      infoHeight,
      3,
      3,
      "FD"
    );

    doc.setFontSize(10);

    const studentName =
      `${student.firstName} ${student.lastName}`;

    const studentInfo = [
      [
        "Student:",
        studentName,
      ],
      [
        "Admission No:",
        student.admissionNo ||
          "—",
      ],
      [
        "Class:",
        selectedClass?.name ||
          "—",
      ],
      [
        "Section:",
        selectedSection?.name ||
          "—",
      ],
       [
        "Category:", studentStream?.name || "—"
      ],
       [
        "Subjects Offered:", totalSubjectsOffered
      ],
      [
        "Session:",
        selectedSession?.name ||
          "—",
      ],
      [
        "Term:",
        selectedTerm?.name ||
          "—",
      ],
    ];

    const leftColumnX = 25;
    const leftValueX = 65;

    const rightColumnX = 105;
    const rightValueX = 145;

    studentInfo.forEach(
      ([label, value], index) => {
        const row =
          Math.floor(index / 2);

        const isRightColumn =
          index % 2 === 1;

        const labelX =
          isRightColumn
            ? rightColumnX
            : leftColumnX;

        const valueX =
          isRightColumn
            ? rightValueX
            : leftValueX;

        const rowY =
          infoY +
          9 +
          row * 8;

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.text(
          label,
          labelX,
          rowY
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.text(
          String(value),
          valueX,
          rowY
        );
      }
    );

    y =
      infoY +
      infoHeight +
      10;

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
  const isOffered = 
    studentSubjectIds.includes(
      Number(result.subjectId));

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
      Number(selectedTermId) ===
      getSessionTermIds()[2]
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
      Number(selectedTermId) ===
      getSessionTermIds()[2]
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

    const leftSignatureX = 25;
    const rightSignatureX = 110;

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(10);

    doc.text(
      "Exam Officer",
      leftSignatureX,
      signatureTopY
    );

    doc.text(
      "Principal",
      rightSignatureX,
      signatureTopY
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(8);

    doc.text(
      "Official Signature",
      leftSignatureX,
      signatureTopY + 25
    );

    doc.text(
      "Official Signature",
      rightSignatureX,
      signatureTopY + 25
    );

    doc.rect(
      leftSignatureX,
      signatureTopY + 28,
      signatureWidth,
      18
    );

    doc.rect(
      rightSignatureX,
      signatureTopY + 28,
      signatureWidth,
      18
    );

    doc.setFontSize(8);

    doc.text(
      "Signature / Stamp",
      leftSignatureX + 18,
      signatureTopY + 39
    );

    doc.text(
      "Signature / Stamp",
      rightSignatureX + 18,
      signatureTopY + 39
    );

    y =
      signatureTopY +
      55;

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
      `${student.firstName}-${student.lastName}-Result.pdf`
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
                  Number(term.academicSessionId) ===
                  Number(selectedSessionId)
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
                    Number(
                      selectedSessionId
                    )
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
                  Number(
                    selectedClassId
                  )
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
                    {student.firstName}{" "}
                    {student.lastName}
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
                        getStudentEnrollment(
                          student,
                          Number(
                            selectedSessionId
                          )
                        );

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
                            {
                              student.firstName
                            }{" "}
                            {
                              student.lastName
                            }
                          </td>

                          {loadedSubjects.map(
                            (subject) => {
                              const isSubjectOffered =
                                studentSubjects.some(
                                  (item) =>
                                    Number(
                                      item.id
                                    ) ===
                                    Number(
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
                          {
                            student.firstName
                          }{" "}
                          {
                            student.lastName
                          }
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