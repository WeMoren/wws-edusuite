
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import useAcademicPerformanceAnalytics from "../../hooks/useAcademicPerformanceAnalytics";
import "./AcademicAnalytics.css";

const AcademicAnalytics = () => {
  const { authToken } = useAuth();

  const [academicSessions, setAcademicSessions] = useState([]);
  const [academicTerms, setAcademicTerms] = useState([]);
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupError, setSetupError] = useState("");

  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");

  useEffect(() => {
    if (!authToken) {
      setSetupLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadAcademicSetup = async () => {
      setSetupLoading(true);
      setSetupError("");

      try {
        const headers = {
          Authorization: `Bearer ${authToken}`,
        };

        const response = await fetch(
            "http://localhost:5000/api/academic-analytics/periods",
            {
                headers,
                signal: controller.signal,
            }
            );

            const periodsData = await response.json().catch(() => ({}));

            if (!response.ok) {
            throw new Error(
                periodsData.message || "Failed to load academic analytics periods."
            );
            }

        

        const sessions = (periodsData.sessions || []).map((session) => ({
          id: session.id,
          name: session.name,
          isCurrent: session.is_current,
        }));

        const terms = (periodsData.terms || []).map((term) => ({
          id: term.id,
          academicSessionId: term.academic_session_id,
          name: term.name,
          displayOrder: term.display_order,
          isCurrent: term.is_current,
        }));

        setAcademicSessions(sessions);
        setAcademicTerms(terms);

        const currentSession =
          sessions.find((session) => session.isCurrent) || sessions[0];

        if (currentSession) {
          setSelectedSessionId(currentSession.id);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setSetupError(
            error.message || "Failed to load academic setup."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setSetupLoading(false);
        }
      }
    };

    loadAcademicSetup();

    return () => controller.abort();
  }, [authToken]);

  const selectedSession = academicSessions.find(
    (session) => session.id === selectedSessionId
  );

  const termsForSelectedSession = useMemo(
    () =>
      academicTerms
        .filter(
          (term) => term.academicSessionId === selectedSessionId
        )
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [academicTerms, selectedSessionId]
  );

  const selectedTerm =
    termsForSelectedSession.find(
      (term) => term.id === selectedTermId
    ) ||
    termsForSelectedSession.find((term) => term.isCurrent) ||
    [...termsForSelectedSession].sort(
      (a, b) => b.displayOrder - a.displayOrder
    )[0];

  useEffect(() => {
    if (
      selectedTermId &&
      !termsForSelectedSession.some(
        (term) => term.id === selectedTermId
      )
    ) {
      setSelectedTermId("");
    }
  }, [selectedTermId, termsForSelectedSession]);

  const {
    analytics,
    loading,
    error,
  } = useAcademicPerformanceAnalytics({
    authToken,
    academicSessionId: selectedSessionId,
    termId: selectedTerm?.id,
    enabled: !setupLoading && Boolean(selectedSessionId) && Boolean(selectedTerm?.id),
  });

    const subjectPerformanceByLevel = useMemo(() => {
    const subjects = analytics?.subjectPerformance || [];

      return subjects.reduce((groups, subject) => {
        const levelName = subject.academicLevelName || "Other";

        if (!groups[levelName]) {
          groups[levelName] = [];
        }

        groups[levelName].push(subject);

        return groups;
      }, {});
    }, [analytics?.subjectPerformance]);

    const getSubjectPerformanceClass = (score) => {
      if (
        score === null ||
        score === undefined ||
        !Number.isFinite(Number(score))
      ) {
        return "academic-analytics__score--neutral";
      }

      if (score >= 80) return "academic-analytics__score--excellent";
      if (score >= 70) return "academic-analytics__score--very-good";
      if (score >= 60) return "academic-analytics__score--good";
      if (score >= 50) return "academic-analytics__score--needs-improvement";

      return "academic-analytics__score--poor";
    };

    const getSubjectPerformanceLabel = (score) => {
      if (
        score === null ||
        score === undefined ||
        !Number.isFinite(Number(score))
      ) {
        return "No average";
      }

      if (score >= 80) return "Excellent";
      if (score >= 70) return "Very good";
      if (score >= 60) return "Good";
      if (score >= 50) return "Needs improvement";

      return "Poor";
    }; 

  if (setupLoading) {
    return (
      <main className="academic-analytics">
        <div className="academic-analytics__state">
          Loading academic setup...
        </div>
      </main>
    );
  }

  if (setupError) {
    return (
      <main className="academic-analytics">
        <div className="academic-analytics__state academic-analytics__state--error">
          {setupError}
        </div>
      </main>
    );
  }

  return (
    <main className="academic-analytics">
      <header className="academic-analytics__header">
        <div>
          <Link
            to="/dashboard"
            className="academic-analytics__back-link"
          >
            ← Back to dashboard
          </Link>

          <h1>Academic Analytics</h1>
          <p>
            Explore finalized academic performance across sessions,
            terms, academic levels, and classes.
          </p>
        </div>
      </header>

      <section className="academic-analytics__filters">
        <label>
          <span>Academic session</span>
          <select
            value={selectedSessionId}
            onChange={(event) => {
              setSelectedSessionId(event.target.value);
              setSelectedTermId("");
            }}
            disabled={academicSessions.length === 0}
          >
            {academicSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
                {session.isCurrent ? " (Current)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Term</span>
          <select
            value={selectedTerm?.id || ""}
            onChange={(event) => setSelectedTermId(event.target.value)}
            disabled={termsForSelectedSession.length === 0}
          >
            {termsForSelectedSession.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
                {term.isCurrent ? " (Current)" : ""}
              </option>
            ))}
          </select>
        </label>
      </section>

      {academicSessions.length === 0 ? (
        <div className="academic-analytics__state">
          No academic sessions are available yet.
        </div>
      ) : termsForSelectedSession.length === 0 ? (
        <div className="academic-analytics__state">
          No terms are configured for this academic session.
        </div>
      ) : loading ? (
        <div className="academic-analytics__state">
          Loading academic performance...
        </div>
      ) : error ? (
        <div
          className="academic-analytics__state academic-analytics__state--error"
          role="alert"
        >
          {error}
        </div>
      ) : !analytics ? (
        <div className="academic-analytics__state">
          Academic performance data is not available for this period.
        </div>
      ) : analytics.summary.finalizedDocuments === 0 ? (
        <div className="academic-analytics__state">
          <strong>No finalized results yet</strong>
          <p>
            Finalized results will appear here once they are available
            for {analytics.academicSessionName}, {analytics.termName}.
          </p>
        </div>
      ) : (
        <>
          <section className="academic-analytics__summary">
            <article className="academic-analytics__card academic-analytics__card--average">
              <span>Overall average</span>
              <strong>
                {analytics.summary.overallAverage === null
                  ? "—"
                  : `${analytics.summary.overallAverage.toFixed(1)}%`}
              </strong>
            </article>

           <article className="academic-analytics__card academic-analytics__card--results">
              <span>Finalized results</span>
              <strong>
                {analytics.summary.finalizedDocuments.toLocaleString()}
              </strong>
            </article>

           <article className="academic-analytics__card academic-analytics__card--classes">
              <span>Classes represented</span>
              <strong>
                {analytics.summary.classesRepresented.toLocaleString()}
              </strong>
            </article>
          </section>

          <section className="academic-analytics__panel">
            <div className="academic-analytics__panel-heading">
              <div>
                <h2>Grade distribution</h2>
                <p>Distribution of available finalized grades</p>
              </div>
            </div>

            {analytics.gradeDistribution.length > 0 ? (
              <div className="academic-analytics__grade-list">
                {analytics.gradeDistribution.map((grade) => (
                  <div
                    className="academic-analytics__grade"
                    key={grade.grade}
                  >
                    <strong>{grade.grade}</strong>

                    <div className="academic-analytics__grade-track">
                      <div
                        className="academic-analytics__grade-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, grade.percentage)
                          )}%`,
                        }}
                      />
                    </div>

                    <span>
                      {grade.studentCount} ({grade.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>
                Grade snapshots are not available for these finalized results.
              </p>
            )}
          </section>

          <section className="academic-analytics__panel">
            <div className="academic-analytics__panel-heading">
              <div>
                <h2>Class performance</h2>
                <p>Average performance by academic level and class</p>
              </div>
            </div>

            {analytics.classPerformance.length > 0 ? (
              <div className="academic-analytics__table-wrapper">
                <table className="academic-analytics__table">
                  <thead>
                    <tr>
                      <th>Academic level</th>
                      <th>Class</th>
                      <th>Finalized results</th>
                      <th>Averages available</th>
                      <th>Average performance</th>
                    </tr>
                  </thead>

                  <tbody>
                    {analytics.classPerformance.map((item) => (
                      <tr
                        key={`${item.academicLevelName}-${item.className}`}
                      >
                        <td>{item.academicLevelName}</td>
                        <td>{item.className}</td>
                        <td>{item.finalizedDocuments}</td>
                        <td>{item.documentsWithAverage}</td>
                        <td>
                          {item.averagePerformance === null
                            ? "—"
                            : `${item.averagePerformance.toFixed(1)}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>
                Class snapshot information is not available for these results.
              </p>
            )}
          </section>

          <section className="academic-analytics__panel">
            <div className="academic-analytics__panel-heading">
              <div>
                <h2>Academic-level performance</h2>
                <p>Average performance grouped by academic level</p>
              </div>
            </div>

            {analytics.academicLevelPerformance.length > 0 ? (
              <div className="academic-analytics__level-list">
                {analytics.academicLevelPerformance.map((item) => (
                  <article
                    className="academic-analytics__level"
                    key={item.academicLevelName}
                  >
                    <div>
                      <strong>{item.academicLevelName}</strong>
                      <span>
                        {item.documentsWithAverage} of{" "}
                        {item.finalizedDocuments} averages available
                      </span>
                    </div>

                    <strong>
                      {item.averagePerformance === null
                        ? "—"
                        : `${item.averagePerformance.toFixed(1)}%`}
                    </strong>
                  </article>
                ))}
              </div>
            ) : (
              <p>
                Academic-level snapshot information is not available.
              </p>
            )}
          </section>

          <section className="academic-analytics__panel">
              <div className="academic-analytics__panel-heading">
                <div>
                  <h2>Subject performance</h2>
                  <p>
                    Average scores for subjects actually taken by students
                    in each academic level
                  </p>
                </div>
              </div>

              <div className="academic-analytics__performance-legend">
                <span>
                  <i className="academic-analytics__legend-dot academic-analytics__legend-dot--excellent" />
                  Excellent (80–100)
                </span>
                <span>
                  <i className="academic-analytics__legend-dot academic-analytics__legend-dot--very-good" />
                  Very good (70–79)
                </span>
                <span>
                  <i className="academic-analytics__legend-dot academic-analytics__legend-dot--good" />
                  Good (60–69)
                </span>
                <span>
                  <i className="academic-analytics__legend-dot academic-analytics__legend-dot--needs-improvement" />
                  Needs improvement (50–59)
                </span>
                <span>
                  <i className="academic-analytics__legend-dot academic-analytics__legend-dot--poor" />
                  Poor (below 50)
                </span>
              </div>

              {Object.keys(subjectPerformanceByLevel).length > 0 ? (
                <div className="academic-analytics__subject-levels">
                  {Object.entries(subjectPerformanceByLevel).map(
                    ([levelName, subjects]) => (
                      <div
                        className="academic-analytics__subject-level"
                        key={levelName}
                      >
                        <h3>{levelName}</h3>

                        <div className="academic-analytics__table-wrapper">
                          <table className="academic-analytics__table academic-analytics__subject-table">
                            <thead>
                              <tr>
                                <th>Subject</th>
                                <th>Students</th>
                                <th>Result entries</th>
                                <th>Average</th>
                                <th>Highest</th>
                                <th>Lowest</th>
                              </tr>
                            </thead>

                            <tbody>
                              {subjects.map((subject) => (
                                <tr key={subject.subjectId}>
                                  <td>
                                    <div className="academic-analytics__subject-name">
                                      <strong>{subject.subjectName}</strong>
                                      {subject.subjectCode && (
                                        <span>{subject.subjectCode}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    {subject.studentsWithSubject.toLocaleString()}
                                  </td>
                                  <td>
                                    {subject.resultEntries.toLocaleString()}
                                  </td>
                                  <td>
                                    <span
                                      className={`academic-analytics__score ${getSubjectPerformanceClass(
                                        subject.averageScore
                                      )}`}
                                      title={getSubjectPerformanceLabel(
                                        subject.averageScore
                                      )}
                                    >
                                      {subject.averageScore === null
                                        ? "—"
                                        : `${subject.averageScore.toFixed(1)}%`}
                                      <small>
                                        {getSubjectPerformanceLabel(
                                          subject.averageScore
                                        )}
                                      </small>
                                    </span>
                                  </td>
                                  <td>
                                    {subject.highestScore === null
                                      ? "—"
                                      : `${subject.highestScore.toFixed(1)}%`}
                                  </td>
                                  <td>
                                    {subject.lowestScore === null
                                      ? "—"
                                      : `${subject.lowestScore.toFixed(1)}%`}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="academic-analytics__empty">
                  Subject-level results are not available for this term.
                </p>
              )}
            </section>

          <section className="academic-analytics__panel">
            <div className="academic-analytics__panel-heading">
              <div>
                <h2>Data coverage</h2>
                <p>
                  Availability of historical result snapshot information
                </p>
              </div>
            </div>

                          <div className="academic-analytics__coverage">
                <div className="academic-analytics__coverage-card academic-analytics__coverage-card--blue">
                  <span className="academic-analytics__coverage-label">
                    Finalized documents
                  </span>
                  <strong>
                    {analytics.dataCoverage.finalizedDocuments.toLocaleString()}
                  </strong>
                  <small>Officially finalized results</small>
                </div>

                <div className="academic-analytics__coverage-card academic-analytics__coverage-card--green">
                  <span className="academic-analytics__coverage-label">
                    Documents with total scores
                  </span>
                  <strong>
                    {analytics.dataCoverage.documentsWithTotalScore.toLocaleString()}
                  </strong>
                  <small>Records containing total scores</small>
                </div>

                <div className="academic-analytics__coverage-card academic-analytics__coverage-card--violet">
                  <span className="academic-analytics__coverage-label">
                    Documents with averages
                  </span>
                  <strong>
                    {analytics.dataCoverage.documentsWithAverage.toLocaleString()}
                  </strong>
                  <small>Records containing average scores</small>
                </div>

                <div className="academic-analytics__coverage-card academic-analytics__coverage-card--amber">
                  <span className="academic-analytics__coverage-label">
                    Documents with grades
                  </span>
                  <strong>
                    {analytics.dataCoverage.documentsWithGrade.toLocaleString()}
                  </strong>
                  <small>Records containing assigned grades</small>
                </div>

                <div className="academic-analytics__coverage-card academic-analytics__coverage-card--cyan">
                  <span className="academic-analytics__coverage-label">
                    Class and level information
                  </span>
                  <strong>
                    {analytics.dataCoverage.documentsWithClassAndAcademicLevel.toLocaleString()}
                  </strong>
                  <small>Records with both details available</small>
                </div>
              </div>
          </section>
        </>
      )}
    </main>
  );
};

export default AcademicAnalytics;
