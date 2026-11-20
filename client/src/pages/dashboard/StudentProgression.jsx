import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useOutletContext } from "react-router-dom";
import NotificationDialog from "../../components/common/NotificationDialog/NotificationDialog";
import StudentPromotionCriteriaManager from "./components/StudentPromotionCriteriaManager";


import "./StudentProgression.css";

const API_BASE_URL = "http://localhost:5000/api";

const OUTCOMES = [
  { value: "promote", label: "Promote" },
  { value: "repeat", label: "Repeat" },
  { value: "graduate", label: "Graduate" },
  { value: "transfer", label: "Transfer" },
  { value: "withdraw", label: "Withdraw" },
];

const StudentProgression = () => {
  const { authToken, currentUser } = useAuth();
  const {
    academicSessions = [],
    academicSetupLoading = false,
    academicSetupError = "",
  } = useOutletContext();

  const userRoles = currentUser?.roles || (
    currentUser?.role ? [currentUser.role] : []
  );

  const canOverride = userRoles.some((role) =>
    ["Principal", "Exam Officer"].includes(role)
  );

  const currentSession = academicSessions.find(
    (session) => session.isCurrent
  );

  const [sourceSessionId, setSourceSessionId] = useState("");
  const [destinationSessionId, setDestinationSessionId] = useState("");

  const [preparedData, setPreparedData] = useState(null);
  const [studentDecisions, setStudentDecisions] = useState({});
  const [previewData, setPreviewData] = useState(null);

  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [academicLevelFilter, setAcademicLevelFilter] = useState("all");

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [loadingPrepare, setLoadingPrepare] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingProcess, setLoadingProcess] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [notification, setNotification] = useState({
    open: false,
    title: "",
    message: "",
  });

  const [confirmProcess, setConfirmProcess] = useState(false);

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

  const showMessage = (title, message) => {
    setNotification({
      open: true,
      title,
      message,
    });
  };

  useEffect(() => {
    if (currentSession?.id && !sourceSessionId) {
      setSourceSessionId(currentSession.id);
    }
  }, [currentSession, sourceSessionId]);

  const destinationSessions = useMemo(
    () => academicSessions.filter(
      (session) => session.id !== sourceSessionId
    ),
    [academicSessions, sourceSessionId]
  );

  const loadPreparation = async () => {
    if (!sourceSessionId || !destinationSessionId) {
      showMessage(
        "Select academic sessions",
        "Choose both a source session and a destination session to continue."
      );
      return;
    }

    if (sourceSessionId === destinationSessionId) {
      showMessage(
        "Invalid session selection",
        "The source and destination sessions must be different."
      );
      return;
    }

    setLoadingPrepare(true);
    setPreparedData(null);
    setPreviewData(null);
    setStudentDecisions({});
    setSelectedStudentIds([]);
    setAcademicLevelFilter("all");

    try {
      const query = new URLSearchParams({
        sourceAcademicSessionId: sourceSessionId,
        destinationAcademicSessionId: destinationSessionId,
      });

      const data = await apiRequest(
        `/student-progressions/prepare?${query.toString()}`
      );

      setPreparedData(data);
      setSelectedStudentIds(
        (data.eligibleStudents || []).map((student) => student.studentId)
      );
    } catch (error) {
      showMessage("Could not prepare progression", error.message);
    } finally {
      setLoadingPrepare(false);
    }
  };

  const updateDecision = (student, changes) => {
    setStudentDecisions((previous) => ({
      ...previous,
      [student.studentId]: {
        ...previous[student.studentId],
        ...changes,
      },
    }));

    setPreviewData(null);
  };

    const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((previous) => {
      if (previous.includes(studentId)) {
        return previous.filter((id) => id !== studentId);
      }

      return [...previous, studentId];
    });

    setPreviewData(null);
  };

  const getVisibleStudents = () => {
    const students = preparedData?.eligibleStudents || [];

    if (academicLevelFilter === "all") {
      return students;
    }

    return students.filter(
      (student) =>
        student.currentPlacement.academicLevelId === academicLevelFilter
    );
  };

  const toggleVisibleStudents = () => {
    const visibleStudents = getVisibleStudents();
    const visibleStudentIds = visibleStudents.map(
      (student) => student.studentId
    );

    const allVisibleSelected = visibleStudentIds.every(
      (studentId) => selectedStudentIds.includes(studentId)
    );

    setSelectedStudentIds((previous) => {
      if (allVisibleSelected) {
        return previous.filter(
          (studentId) => !visibleStudentIds.includes(studentId)
        );
      }

      return [
        ...previous,
        ...visibleStudentIds.filter(
          (studentId) => !previous.includes(studentId)
        ),
      ];
    });

    setPreviewData(null);
  };

 const getSelectedStudents = () => {
  const students = preparedData?.eligibleStudents || [];

  return students.filter(
    (student) =>
      selectedStudentIds.includes(student.studentId) &&
      (
        academicLevelFilter === "all" ||
        student.currentPlacement.academicLevelId === academicLevelFilter
      )
  );
};

  const getDecision = (student) => ({
    outcome: "promote",
    destination: {
      classId: "",
      sectionId: "",
      streamId: "",
      subjectCombinationId: "",
    },
    ...(studentDecisions[student.studentId] || {}),
  });

  const getDestinationLevel = (student) => {
    const decision = getDecision(student);

    if (decision.outcome === "repeat") {
      return student.currentPlacement.academicLevelId;
    }

    if (decision.outcome !== "promote") {
      return null;
    }

    const currentLevel = preparedData?.academicLevels?.find(
      (level) => level.id === student.currentPlacement.academicLevelId
    );

    if (!currentLevel) {
      return null;
    }

    return preparedData.academicLevels.find(
      (level) => level.displayOrder > currentLevel.displayOrder
    )?.id || null;
  };

  const getClassesForStudent = (student) => {
    const levelId = getDestinationLevel(student);

    return (preparedData?.destinationOptions?.classes || []).filter(
      (schoolClass) => schoolClass.academicLevel?.id === levelId
    );
  };

  const getStreamsForStudent = (student) => {
    const levelId = getDestinationLevel(student);

    return (preparedData?.destinationOptions?.streams || []).filter(
      (stream) => stream.academicLevelId === levelId
    );
  };

  const getCombinationsForStudent = (student) => {
    const decision = getDecision(student);

    return (preparedData?.destinationOptions?.subjectCombinations || []).filter(
      (combination) =>
        combination.academicLevelId === getDestinationLevel(student)
        && combination.streamId === decision.destination.streamId
    );
  };

   const buildProgressions = () => {
    const selectedStudents = getSelectedStudents();

    if (!selectedStudents.length) {
      throw new Error("Select at least one student to continue.");
    }

    return selectedStudents.map((student) => {
      const decision = getDecision(student);
      const outcome = decision.outcome;

      const progression = {
        studentId: student.studentId,
        outcome,
      };

      if (["promote", "repeat"].includes(outcome)) {
        progression.destination = {
          classId: decision.destination.classId,
          sectionId: decision.destination.sectionId,
          streamId: decision.destination.streamId || null,
          subjectCombinationId:
            decision.destination.subjectCombinationId || null,
        };
      }

      if (decision.overrideReason?.trim()) {
        progression.overrideReason = decision.overrideReason.trim();
      }

      return progression;
    });
  };

  const handlePreview = async () => {
    setLoadingPreview(true);

    try {
      const data = await apiRequest("/student-progressions/preview", {
        method: "POST",
        body: JSON.stringify({
          sourceAcademicSessionId: sourceSessionId,
          destinationAcademicSessionId: destinationSessionId,
          studentProgressions: buildProgressions(),
        }),
      });

      setPreviewData(data.preview);
      setShowHistory(false);
    } catch (error) {
      showMessage("Preview could not be completed", error.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleProcess = async () => {
    setLoadingProcess(true);

    try {
      const data = await apiRequest("/student-progressions/process", {
        method: "POST",
        body: JSON.stringify({
          sourceAcademicSessionId: sourceSessionId,
          destinationAcademicSessionId: destinationSessionId,
          studentProgressions: buildProgressions(),
        }),
      });

      setConfirmProcess(false);
      setPreviewData(null);
      setPreparedData(null);
      setStudentDecisions({});
      setSelectedStudentIds([]);
      setAcademicLevelFilter("all");

      showMessage(
        "Progression completed",
        data.message || "Student progression was processed successfully."
      );
    } catch (error) {
      setConfirmProcess(false);
      showMessage("Progression was not completed", error.message);
    } finally {
      setLoadingProcess(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);

    try {
      const data = await apiRequest(
        "/student-progressions/history?page=1&limit=20"
      );

      setHistory(data.history || []);
      setShowHistory(true);
      setPreviewData(null);
    } catch (error) {
      showMessage("Could not load progression history", error.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const renderPlacementFields = (student) => {
    const decision = getDecision(student);
    const classes = getClassesForStudent(student);
    const selectedClass = classes.find(
      (schoolClass) => schoolClass.id === decision.destination.classId
    );
    const streams = getStreamsForStudent(student);
    const combinations = getCombinationsForStudent(student);

    return (
      <div className="progression-placement">
        <label>
          Destination class
          <select
            value={decision.destination.classId}
            onChange={(event) => updateDecision(student, {
              destination: {
                classId: event.target.value,
                sectionId: "",
                streamId: "",
                subjectCombinationId: "",
              },
            })}
          >
            <option value="">Select class</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Destination section
          <select
            value={decision.destination.sectionId}
            disabled={!selectedClass}
            onChange={(event) => updateDecision(student, {
              destination: {
                ...decision.destination,
                sectionId: event.target.value,
              },
            })}
          >
            <option value="">Select section</option>
            {(selectedClass?.sections || []).map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Destination stream <span>(Optional)</span>
          <select
            value={decision.destination.streamId}
            onChange={(event) => updateDecision(student, {
              destination: {
                ...decision.destination,
                streamId: event.target.value,
                subjectCombinationId: "",
              },
            })}
          >
            <option value="">No stream</option>
            {streams.map((stream) => (
              <option key={stream.id} value={stream.id}>
                {stream.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Subject combination <span>(Optional)</span>
          <select
            value={decision.destination.subjectCombinationId}
            disabled={!decision.destination.streamId}
            onChange={(event) => updateDecision(student, {
              destination: {
                ...decision.destination,
                subjectCombinationId: event.target.value,
              },
            })}
          >
            <option value="">No subject combination</option>
            {combinations.map((combination) => (
              <option key={combination.id} value={combination.id}>
                {combination.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  };

  const renderStudentDecision = (student) => {
    const decision = getDecision(student);
    const destinationLevelId = getDestinationLevel(student);
    const destinationLevel = preparedData.academicLevels.find(
      (level) => level.id === destinationLevelId
    );

    return (
      <article
        className={`progression-student-card ${
          selectedStudentIds.includes(student.studentId)
            ? "selected"
            : "not-selected"
        }`}
        key={student.studentId}
      >
        <div className="progression-student-heading">
          <label className="progression-student-selection">
            <input
              type="checkbox"
              checked={selectedStudentIds.includes(student.studentId)}
              onChange={() => toggleStudentSelection(student.studentId)}
            />
            <span>Select</span>
          </label>

          <div className="progression-student-identity">
            <h3>
              {student.firstName} {student.middleName} {student.lastName}
            </h3>
            <p>
              Admission No: {student.admissionNo || "—"}
            </p>
          </div>
          <span className="progression-current-level">
            {student.currentPlacement.academicLevelName}
          </span>
        </div>

        <div className="progression-decision-fields">
          <label>
            Progression outcome
            <select
              value={decision.outcome}
              onChange={(event) => updateDecision(student, {
                outcome: event.target.value,
                destination: {
                  classId: "",
                  sectionId: "",
                  streamId: "",
                  subjectCombinationId: "",
                },
                overrideReason: "",
              })}
            >
              {OUTCOMES.map((outcome) => (
                <option key={outcome.value} value={outcome.value}>
                  {outcome.label}
                </option>
              ))}
            </select>
          </label>

          {["promote", "repeat"].includes(decision.outcome) && (
            <div className="progression-destination">
              <div className="progression-destination-heading">
                <strong>Destination placement</strong>
                <span>
                  {destinationLevel?.name || "No next academic level"}
                </span>
              </div>
              {renderPlacementFields(student)}
            </div>
          )}
        </div>
      </article>
    );
  };

  const renderPreview = () => (
    <section className="progression-panel">
      <div className="progression-section-heading">
        <div>
          <h2>Validated progression preview</h2>
          <p>
            Review the backend evaluation and decisions before processing.
          </p>
        </div>
        <button
          type="button"
          className="progression-secondary-button"
          onClick={() => setPreviewData(null)}
        >
          Back to decisions
        </button>
      </div>

      {previewData.students.some(
        (student) => student.criteriaConfigurationMissing
      ) && (
        <div className="progression-criteria-batch-warning">
          <strong>Some students cannot be processed</strong>
          <p>
            {previewData.students.filter(
              (student) => student.criteriaConfigurationMissing
            ).length}{" "}
            student(s) have no active promotion criteria configured for
            their academic level. Go back to decisions, deselect those
            students, and preview the remaining students again.
          </p>
        </div>
      )}

      <div className="progression-summary-grid">
        <div>
          <span>Total students</span>
          <strong>{previewData.totalStudents}</strong>
        </div>
        {OUTCOMES.map((outcome) => (
          <div key={outcome.value}>
            <span>{outcome.label}</span>
            <strong>
              {previewData.outcomeCounts?.[outcome.value] || 0}
            </strong>
          </div>
        ))}
      </div>

      <div className="progression-preview-list">
        {previewData.students.map((student) => (
          <article
            className="progression-preview-card"
            key={student.studentId}
          >
            <div className="progression-student-heading">
              <div>
                <h3>
                  {student.firstName} {student.middleName} {student.lastName}
                </h3>
                <p>{student.admissionNo || "—"}</p>
              </div>
              <span className={`progression-outcome-badge ${student.outcome}`}>
                {student.outcome}
              </span>
            </div>

            {student.criteriaConfigurationMissing && (
              <div className="progression-criteria-blocked">
                <strong>Progression blocked — criteria not configured</strong>
                <p>
                  No active promotion criteria are configured for this
                  student's academic level. Return to decisions and deselect
                  this student before processing the remaining students.
                </p>
              </div>
            )}

            {student.criteriaEvaluation && (
              <div className="progression-criteria">
                <strong>Promotion criteria</strong>
                <span>
              Status: {student.criteriaEvaluation.evaluationStatus}
                </span>
                <span>
                  Recommendation:{" "}
                  {student.criteriaEvaluation.recommendedOutcome || "—"}
                </span>
                {student.criteriaEvaluation.reasons?.length > 0 && (
                  <ul>
                    {student.criteriaEvaluation.reasons.map((reason, index) => (
                      <li key={`${student.studentId}-reason-${index}`}>
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {student.requiresOverride && (
              <div className="progression-override-notice">
                <strong>Override required</strong>
                <p>
                  {canOverride
                    ? "A reason is required from an authorized Principal or Exam Officer."
                    : "This decision requires an authorized Principal or Exam Officer to provide an override reason."}
                </p>
                {canOverride && (
                  <label>
                    Override reason
                    <textarea
                      value={
                        studentDecisions[student.studentId]?.overrideReason || ""
                      }
                      onChange={(event) => {
                        const overrideReason = event.target.value;

                        setStudentDecisions((previous) => ({
                          ...previous,
                          [student.studentId]: {
                            ...previous[student.studentId],
                            overrideReason,
                          },
                        }));
                      }}
                      rows={3}
                      placeholder="Explain why this decision is being overridden..."
                    />
                  </label>
                )}
              </div>
            )}

            {student.destinationPlacement && (
              <p className="progression-preview-placement">
                Destination: {student.destinationAcademicLevel?.name || "—"}
                {" · "}
                Class: {student.destinationPlacement.className || "—"}
              </p>
            )}
          </article>
        ))}
      </div>

      <div className="progression-actions">
        <button
          type="button"
          className="progression-primary-button"
          onClick={() => setConfirmProcess(true)}
          disabled={
            loadingProcess
            || previewData.students.some(
              (student) => student.criteriaConfigurationMissing
            )
          }
        >
          Process progression
        </button>
      </div>
    </section>
  );

  return (
    <main className="student-progression-page">
      <header className="progression-page-header">
        <div>
          <h1>Student Progression</h1>
          <p>
            Review student outcomes and move students into the next academic
            session.
          </p>
        </div>
        <button
          type="button"
          className="progression-secondary-button"
          onClick={loadHistory}
          disabled={loadingHistory}
        >
          {loadingHistory ? "Loading history..." : "View progression history"}
        </button>
      </header>

      <StudentPromotionCriteriaManager />

      {academicSetupError && (
        <div className="progression-error">{academicSetupError}</div>
      )}

      <section className="progression-panel">
        <div className="progression-section-heading">
          <div>
            <h2>Academic sessions</h2>
            <p>
              Select the session students are currently enrolled in and the
              session they will progress into.
            </p>
          </div>
        </div>

        <div className="progression-session-fields">
          <label>
            Source session
            <select
              value={sourceSessionId}
              onChange={(event) => {
                setSourceSessionId(event.target.value);
                setPreparedData(null);
                setPreviewData(null);
              }}
              disabled={academicSetupLoading}
            >
              <option value="">Select source session</option>
              {academicSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}{session.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            Destination session
            <select
              value={destinationSessionId}
              onChange={(event) => {
                setDestinationSessionId(event.target.value);
                setPreparedData(null);
                setPreviewData(null);
              }}
              disabled={!sourceSessionId || academicSetupLoading}
            >
              <option value="">Select destination session</option>
              {destinationSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="progression-primary-button"
            onClick={loadPreparation}
            disabled={loadingPrepare || academicSetupLoading}
          >
            {loadingPrepare ? "Preparing..." : "Load eligible students"}
          </button>
        </div>
      </section>

            {preparedData && !previewData && !showHistory && (
        <section className="progression-panel">
          <div className="progression-section-heading">
            <div>
              <h2>Student decisions</h2>
              <p>
                {preparedData.totalEligibleStudents} eligible student(s) found.
                Select an outcome and destination placement for each student.
              </p>
            </div>
          </div>

          {preparedData.eligibleStudents.length === 0 ? (
            <div className="progression-empty">
              No eligible active students were found in this source session.
            </div>
          ) : (
            <>
              <div className="progression-selection-toolbar">
                <label className="progression-level-filter">
                  Filter by academic level
                  <select
                    value={academicLevelFilter}
                    onChange={(event) => {
                      setAcademicLevelFilter(event.target.value);
                    }}
                  >
                    <option value="all">All academic levels</option>
                    {preparedData.academicLevels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </label>

               <div className="progression-selection-summary">
                    <strong>
                      {selectedStudentIds.length} of{" "}
                      {preparedData.eligibleStudents.length} selected overall
                    </strong>

                    <strong>
                      {
                        getVisibleStudents().filter((student) =>
                          selectedStudentIds.includes(student.studentId)
                        ).length
                      } of {getVisibleStudents().length} visible selected
                    </strong>
                  <button
                    type="button"
                    className="progression-secondary-button"
                    onClick={toggleVisibleStudents}
                  >
                    {getVisibleStudents().length > 0 &&
                    getVisibleStudents().every((student) =>
                      selectedStudentIds.includes(student.studentId)
                    )
                      ? "Deselect visible"
                      : "Select visible"}
                  </button>
                </div>
              </div>

              {getVisibleStudents().length === 0 ? (
                <div className="progression-empty">
                  No eligible students were found for this academic level.
                </div>
              ) : (
                <div className="progression-student-list">
                  {getVisibleStudents().map(renderStudentDecision)}
                </div>
              )}

              <div className="progression-actions">
                <button
                  type="button"
                  className="progression-primary-button"
                  onClick={handlePreview}
                                  disabled={
                    loadingPreview || getSelectedStudents().length === 0
                  }
                >
                  {loadingPreview
                    ? "Validating..."
                    : `Preview ${getSelectedStudents().length} selected student(s)`}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {previewData && renderPreview()}

      {showHistory && (
        <section className="progression-panel">
          <div className="progression-section-heading">
            <div>
              <h2>Progression history</h2>
              <p>Recently processed student progression batches.</p>
            </div>
            <button
              type="button"
              className="progression-secondary-button"
              onClick={() => setShowHistory(false)}
            >
              Back to progression
            </button>
          </div>

          {history.length === 0 ? (
            <div className="progression-empty">
              No progression history is available yet.
            </div>
          ) : (
            <div className="progression-history-list">
              {history.map((batch) => (
                <article className="progression-history-card" key={batch.id}>
                  <div>
                    <h3>
                      {batch.sourceSession?.name || "Source session"}
                      {" → "}
                      {batch.destinationSession?.name || "Destination session"}
                    </h3>
                    <p>
                      Processed by {batch.processedBy || "—"}
                      {" · "}
                      {batch.processedAt
                        ? new Date(batch.processedAt).toLocaleString()
                        : "—"}
                    </p>
                  </div>

                  <div className="progression-history-counts">
                    <strong>{batch.totalStudents} students</strong>
                    {OUTCOMES.map((outcome) => (
                      <span key={outcome.value}>
                        {outcome.label}:{" "}
                        {batch.outcomeCounts?.[outcome.value] || 0}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {notification.open && (
        <NotificationDialog
            title={notification.title}
            message={notification.message}
            onClose={() => setNotification((previous) => ({
            ...previous,
            open: false,
            }))}
        />
     )}

      {confirmProcess && (
  <div
    className="progression-confirm-overlay"
    role="presentation"
  >
    <div
      className="progression-confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="progression-confirm-title"
    >
      <h2 id="progression-confirm-title">
        Process student progression?
      </h2>

      <p>
        This will apply the validated progression decisions and create
        destination enrollments. Only continue after reviewing the preview.
      </p>

      <div className="progression-confirm-actions">
        <button
          type="button"
          className="progression-confirm-cancel"
          onClick={() => setConfirmProcess(false)}
          disabled={loadingProcess}
        >
          Go back
        </button>

        <button
          type="button"
          className="progression-confirm-submit"
          onClick={handleProcess}
          disabled={loadingProcess}
        >
          {loadingProcess ? "Processing..." : "Confirm and process"}
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
};

export default StudentProgression;
