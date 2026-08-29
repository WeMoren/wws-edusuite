import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import NotificationDialog from "../../components/common/NotificationDialog/NotificationDialog";

const Results = () => {
  const {
    academicSessions,
    academicTerms,
    classes,
    sections,
    students,
    enrollments,
    subjects,
    results,
    setResults,
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


    const notify = ({ title, message }) => {
        setNotification({ title, message });
        setShowNotification(true);
    };


  const handleLoadResults = () => {
  if (
    !selectedSessionId ||
    !selectedTermId ||
    !selectedClassId ||
    !selectedSectionId
  ) {
    notify({
      title: "Incomplete Selection",
      message: "Please select session, term, class, and section.",
    });
    return;
  }

  const sessionId = Number(selectedSessionId);
  const classId = Number(selectedClassId);
  const sectionId = Number(selectedSectionId);

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
      message: "The selected class and section do not match.",
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

  const matchingSubjects = subjects.filter((subject) =>
    subject.academicLevelIds?.includes(selectedClass.academicLevelId)
  );

  setLoadedStudents(matchingStudents);
  setLoadedSubjects(matchingSubjects);
  setResultsLoaded(true);
};


 const handleSaveResults = () => {
  const updatedResults = [...results];

  loadedStudents.forEach((student) => {
    loadedSubjects.forEach((subject) => {
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
          result.subjectId === subject.id &&
          result.academicSessionId === Number(selectedSessionId) &&
          result.academicTermId === Number(selectedTermId) &&
          result.sectionId === Number(selectedSectionId)
      );

      const resultData = {
        studentId: student.id,
        subjectId: subject.id,
        academicSessionId: Number(selectedSessionId),
        academicTermId: Number(selectedTermId),
        sectionId: Number(selectedSectionId),
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


  return (
    <div className="results-page">
      <h1>Results</h1>
      <p>Enter and manage student academic results.</p>

      <div className="results-filters">
        <div>
          <label>Academic Session</label>
          <select 
                value={selectedSessionId} 
                onChange={(e) => setSelectedSessionId(e.target.value)}
            >
            <option value="">Select session</option>
            {academicSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Academic Term</label>
          <select 
                value={selectedTermId} 
                onChange={(e) => setSelectedTermId(e.target.value)}
            >
            <option value="">Select term</option>
            {academicTerms
                .filter((term) => term.academicSessionId === Number(selectedSessionId))
                .map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Class</label>
          <select 
                value={selectedClassId} 
                onChange={(e) => setSelectedClassId(e.target.value)}
            >
            <option value="">Select class</option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Section</label>
          <select 
                value={selectedSectionId} 
                onChange={(e) => setSelectedSectionId(e.target.value)}
            >
            <option value="">Select section</option>
            {sections
            .filter((section) => section.classId === Number(selectedClassId))
            .map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </div>


            <button
                type="button"
                onClick={handleLoadResults}
                >
                Load Results
            </button>

            {showNotification && (
                <NotificationDialog
                    title={notification.title}
                    message={notification.message}
                    onClose={() => setShowNotification(false)}
            />
            )}

      </div>


        {resultsLoaded && (
                <div className="results-preview">
                    <h2>Students & Subjects</h2>

                    <div className="results-preview__students">
                    <h3>Students</h3>

                    {loadedStudents.length > 0 ? (
                        loadedStudents.map((student) => (
                        <p key={student.id}>
                            {student.firstName} {student.lastName}
                        </p>
                        ))
                    ) : (
                        <p>No students found for this class and section.</p>
                    )}
                    </div>

                    <div className="results-preview__subjects">
                    <h3>Subjects</h3>

                    {loadedSubjects.length > 0 ? (
                        loadedSubjects.map((subject) => (
                        <p key={subject.id}>
                            {subject.name}
                        </p>
                        ))
                    ) : (
                        <p>No subjects have been assigned to this academic level.</p>
                    )}
                    </div>
                </div>
        )}

<p>Loaded students: {loadedStudents.length}</p>
<p>Loaded subjects: {loadedSubjects.length}</p>

            {resultsLoaded && 
            loadedStudents.length > 0 && 
            loadedSubjects.length > 0 && (
                <div className="results-entry">
                    <h2>Enter Results</h2>

                    <div className="results-entry__table-wrapper">
                    <table className="results-entry__table">
                        <thead>
                        <tr>
                            <th>Student</th>

                            {loadedSubjects.map((subject) => (
                            <th key={subject.id}>
                                {subject.name}
                            </th>
                            ))}
                        </tr>
                        </thead>

                        <tbody>
                        {loadedStudents.map((student) => (
                            <tr key={student.id}>
                            <td>
                                {student.firstName} {student.lastName}
                            </td>

                            {loadedSubjects.map((subject) => {
                                const entryKey = `${student.id}-${subject.id}`;
                                const entry = scoreEntries[entryKey] || {
                                ca: "",
                                exam: "",
                                };

                                const total =
                                (Number(entry.ca) || 0) +
                                (Number(entry.exam) || 0);

                            return (
                                <td key={subject.id}>
                                <div className="results-entry__scores">
                                    <span className="results-entry__subject">
                                    {subject.name}
                                    </span>

                                    <label>
                                        CA
                                    <input
                                        type="number"
                                        min="0"
                                        max="30"
                                        value={entry.ca}
                                        onChange={(e) =>
                                        setScoreEntries((prev) => ({
                                            ...prev,
                                            [entryKey]: {
                                            ...entry,
                                            ca: e.target.value,
                                            },
                                        }))
                                        }
                                />
                                </label>

                                <label>
                                Exam
                                <input
                                    type="number"
                                    min="0"
                                    max="70"
                                    value={entry.exam}
                                    onChange={(e) =>
                                    setScoreEntries((prev) => ({
                                        ...prev,
                                        [entryKey]: {
                                        ...entry,
                                        exam: e.target.value,
                                        },
                                    }))
                                    }
                                />
                                </label>

                        <strong>Total: {total}</strong>
                    </div>
                    </td>
                                );
                            })}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

         {resultsLoaded && loadedStudents.length > 0 && loadedSubjects.length > 0 && (
            <button
                type="button"
                onClick={handleSaveResults}
            >
                Save Results
            </button>
)}
    </div>
  );
};

export default Results;