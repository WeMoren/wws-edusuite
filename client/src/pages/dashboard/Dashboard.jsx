
import React, {useEffect, useState } from "react";
import {Link, useOutletContext } from "react-router-dom";
import {
  GraduationCap,
  Users,
  UsersRound,
  School,
  ClipboardCheck,
  BriefcaseBusiness,
} from "lucide-react";
import StatCard from "../../components/dashboard/StatCard/StatCard";
import ActivityItem from "../../components/dashboard/ActivityItem/ActivityItem";
import EventItem from "../../components/dashboard/EventItem/EventItem";
import quickActions from "../../data/quickActions";
import ActionButton from "../../components/dashboard/ActionButton/ActionButton";
import EventModal from "../../components/dashboard/EventModal/EventModal";
import { useAuth } from "../../auth/AuthContext";
import useAcademicPerformanceAnalytics from "../../hooks/useAcademicPerformanceAnalytics";
import "./Dashboard.css";

const getRelativeTime = (createdAt) => {
  const now = new Date();
  const created = new Date(createdAt);
  const differenceInSeconds = Math.floor((now - created) / 1000);

  if (differenceInSeconds < 60) {
    return "Just now";
  }

  const differenceInMinutes = Math.floor(differenceInSeconds / 60);

  if (differenceInMinutes < 60) {
    return `${differenceInMinutes} ${
      differenceInMinutes === 1 ? "minute" : "minutes"
    } ago`;
  }

  const differenceInHours = Math.floor(differenceInMinutes / 60);

  if (differenceInHours < 24) {
    return `${differenceInHours} ${
      differenceInHours === 1 ? "hour" : "hours"
    } ago`;
  }

  const differenceInDays = Math.floor(differenceInHours / 24);

  if (differenceInDays === 1) {
    return "Yesterday";
  }

  return `${differenceInDays} days ago`;
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
};

const Dashboard = () => {
  const { authToken, currentUser } = useAuth();

  const {
    students,
    enrollments,
    academicSessions,
    academicTerms = [],
    teachers,
    staffCount,
    parents,
    classes,
    attendance,
    recentActivities,
    upcomingEvents,
    createEvent,
  } = useOutletContext();

  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedAcademicSessionId, setSelectedAcademicSessionId] =
    useState("");
  const [analyticsAcademicSessionId, setAnalyticsAcademicSessionId] =
    useState("");
  const [analyticsTermId, setAnalyticsTermId] = useState("");

  const [analyticsSessions, setAnalyticsSessions] = useState([]);
const [analyticsTerms, setAnalyticsTerms] = useState([]);
const [analyticsPeriodsLoading, setAnalyticsPeriodsLoading] = useState(false);
const [analyticsPeriodsError, setAnalyticsPeriodsError] = useState("");

  const userRoles =
    Array.isArray(currentUser?.roles) && currentUser.roles.length > 0
      ? currentUser.roles
      : currentUser?.role
        ? [currentUser.role]
        : [];

  const canViewAcademicAnalytics =
    userRoles.some((role) =>
      ["Principal", "School Admin", "Exam Officer"].includes(role)
    ) || currentUser?.isHeadTeacher === true;

    useEffect(() => {
  if (!authToken || !canViewAcademicAnalytics) {
    setAnalyticsSessions([]);
    setAnalyticsTerms([]);
    setAnalyticsPeriodsError("");
    setAnalyticsPeriodsLoading(false);
    return;
  }

  const controller = new AbortController();

  const loadAnalyticsPeriods = async () => {
    setAnalyticsPeriodsLoading(true);
    setAnalyticsPeriodsError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/academic-analytics/periods",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          signal: controller.signal,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load academic analytics periods."
        );
      }

      setAnalyticsSessions(
        (data.sessions || []).map((session) => ({
          id: session.id,
          name: session.name,
          isCurrent: session.is_current,
        }))
      );

      setAnalyticsTerms(
        (data.terms || []).map((term) => ({
          id: term.id,
          academicSessionId: term.academic_session_id,
          name: term.name,
          displayOrder: term.display_order,
          isCurrent: term.is_current,
        }))
      );
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Failed to load academic analytics periods:", error);
        setAnalyticsPeriodsError(error.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setAnalyticsPeriodsLoading(false);
      }
    }
  };

  loadAnalyticsPeriods();

  return () => controller.abort();
}, [authToken, canViewAcademicAnalytics]);

  const today = new Date().toISOString().split("T")[0];

  const currentAcademicSession = academicSessions.find(
    (session) => session.isCurrent
  );

  const selectedAnalyticsSession =
  analyticsSessions.find(
    (session) => session.id === analyticsAcademicSessionId
  ) ||
  analyticsSessions.find((session) => session.isCurrent) ||
  analyticsSessions[0];

const analyticsTermsForSession = analyticsTerms.filter(
  (term) =>
    term.academicSessionId === selectedAnalyticsSession?.id
);

const selectedAnalyticsTerm =
  analyticsTermsForSession.find(
    (term) => term.id === analyticsTermId
  ) ||
  analyticsTermsForSession.find((term) => term.isCurrent) ||
  [...analyticsTermsForSession].sort(
    (a, b) => b.displayOrder - a.displayOrder
  )[0];

  const {
    analytics: academicPerformance,
    loading: academicPerformanceLoading,
    error: academicPerformanceError,
  } = useAcademicPerformanceAnalytics({
    authToken,
    academicSessionId: selectedAnalyticsSession?.id,
    termId: selectedAnalyticsTerm?.id,
    enabled: canViewAcademicAnalytics,
  });

  const selectedAcademicSession =
    academicSessions.find(
      (session) => session.id === selectedAcademicSessionId
    ) ||
    currentAcademicSession ||
    academicSessions[0];

  const isCurrentSession =
    selectedAcademicSession?.id === currentAcademicSession?.id;

  // Preserve the existing current-session eligibility calculation.
  const currentSessionEnrollments = enrollments.filter(
    (enrollment) =>
      enrollment.academicSessionId === currentAcademicSession?.id &&
      enrollment.status === "active" &&
      students.some(
        (student) =>
          student.id === enrollment.studentId &&
          student.status === "active"
      )
  );

  const eligibleStudents = students.filter(
    (student) =>
      student.status === "active" &&
      currentSessionEnrollments.some(
        (enrollment) => enrollment.studentId === student.id
      )
  );

  // All enrolments belonging to the selected session.
  // Historical enrolment statuses must not exclude past students.
  const selectedSessionEnrollments = enrollments.filter(
    (enrollment) =>
      enrollment.academicSessionId === selectedAcademicSession?.id
  );

  const selectedSessionStudents = students.filter(
    (student) =>
      selectedSessionEnrollments.some(
        (enrollment) => enrollment.studentId === student.id
      )
  );

  const selectedSessionStudentCount = isCurrentSession
    ? eligibleStudents.length
    : selectedSessionStudents.length;

  const selectedSessionClasses = classes.filter(
    (schoolClass) =>
      schoolClass.academicSessionId === selectedAcademicSession?.id
  );

  // Preserve the existing Attendance Today calculation for the current session.
  const todayAttendance = attendance.filter(
    (record) =>
      record.date === today &&
      record.academicSessionId === currentAcademicSession?.id
  );

  const presentEligibleStudents = eligibleStudents.filter(
    (student) =>
      todayAttendance.some(
        (record) =>
          record.studentId === student.id &&
          record.status === "present" &&
          currentSessionEnrollments.some(
            (enrollment) =>
              enrollment.id === record.enrollmentId
          )
      )
  );

  const attendancePercentage =
    eligibleStudents.length > 0
      ? Math.round(
          (presentEligibleStudents.length /
            eligibleStudents.length) *
            100
        )
      : 0;

  // Historical attendance rate uses only recorded present/absent entries.
  const selectedSessionAttendance = attendance.filter(
    (record) =>
      record.academicSessionId === selectedAcademicSession?.id
  );

  const recordedHistoricalAttendance = selectedSessionAttendance.filter(
    (record) =>
      record.status === "present" || record.status === "absent"
  );

  const historicalPresentCount = recordedHistoricalAttendance.filter(
    (record) => record.status === "present"
  ).length;

  const historicalAttendancePercentage =
    recordedHistoricalAttendance.length > 0
      ? Math.round(
          (historicalPresentCount /
            recordedHistoricalAttendance.length) *
            100
        )
      : 0;

  const displayedAttendancePercentage = isCurrentSession
    ? attendancePercentage
    : historicalAttendancePercentage;

  const upcomingEventPreview = [...upcomingEvents]
    .filter((event) => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  const recentActivityPreview = recentActivities.slice(0, 5);

  const firstName = currentUser?.firstName || "there";

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__heading">
          <span className="dashboard__eyebrow">SCHOOL OVERVIEW</span>
          <h1>
            {getGreeting()}, {firstName}
            {currentUser?.lastName ? ` ${currentUser.lastName}` : ""}!
          </h1>
          <p>
            Here's what's happening across your school today.
          </p>
        </div>

        <div className="dashboard__session-filter">
          <label htmlFor="dashboard-academic-session">
            Academic Session
          </label>

          <select
            id="dashboard-academic-session"
            value={selectedAcademicSession?.id || ""}
            onChange={(event) =>
              setSelectedAcademicSessionId(event.target.value)
            }
            disabled={academicSessions.length === 0}
          >
           {academicSessions.length > 0 ? (
              academicSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                  {session.isCurrent ? " (Current)" : ""}
                </option>
              ))
            ) : (
              <option value="">No sessions available</option>
            )}
          </select>

          <span>
            Academic statistics reflect this session.
          </span>
        </div>
      </header>

      <section className="dashboard__stats" aria-label="School statistics">
        <StatCard
          title="Students"
          value={selectedSessionStudentCount}
          icon={GraduationCap}
        />

        <StatCard
          title="Teachers"
          value={teachers.length}
          icon={Users}
        />

        <StatCard
          title="Parents"
          value={parents.length}
          icon={UsersRound}
        />

        <StatCard
          title="Classes"
          value={selectedSessionClasses.length}
          icon={School}
        />

        <StatCard
          title={isCurrentSession ? "Attendance Today" : "Attendance Rate"}
          value={`${displayedAttendancePercentage}%`}
          icon={ClipboardCheck}
        />

        <StatCard
          title="Management Staff"
          value={staffCount}
          icon={BriefcaseBusiness}
        />
      
      </section>

      {canViewAcademicAnalytics && (
        <section
          className="dashboard__panel dashboard__academic-performance"
          aria-labelledby="dashboard-academic-performance-title"
        >
          <div className="dashboard__panel-heading dashboard__academic-performance-heading">
            <div>
              <h2 id="dashboard-academic-performance-title">
                Academic Performance
              </h2>
              <p>
                An overview of finalized student results for the selected
                academic period.
              </p>
            </div>

            <Link
              to="/dashboard/academic-analytics"
              className="dashboard__academic-performance-link"
            >
              View detailed analytics
            </Link>
          </div>

          <div className="dashboard__academic-performance-filters">
            <label>
              <span>Academic session</span>
              <select
                value={selectedAnalyticsSession?.id || ""}
                onChange={(event) => {
                  setAnalyticsAcademicSessionId(event.target.value);
                  setAnalyticsTermId("");
                }}
                disabled={analyticsPeriodsLoading || analyticsSessions.length === 0}
              >
               {analyticsSessions.length > 0 ? (
                  analyticsSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                      {session.isCurrent ? " (Current)" : ""}
                    </option>
                  ))
                ) : (
                  <option value="">No sessions available</option>
                )}
              </select>
            </label>

            <label>
              <span>Term</span>
              <select
                value={selectedAnalyticsTerm?.id || ""}
                onChange={(event) => setAnalyticsTermId(event.target.value)}
                disabled={analyticsTermsForSession.length === 0}
              >
                {analyticsTermsForSession.length > 0 ? (
                  analyticsTermsForSession
                    .slice()
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                        {term.isCurrent ? " (Current)" : ""}
                      </option>
                    ))
                ) : (
                  <option value="">No terms available</option>
                )}
              </select>
            </label>
          </div>

          

                    {analyticsPeriodsLoading ? (
            <div className="dashboard__academic-performance-state">
              Loading academic periods...
            </div>
          ) : analyticsPeriodsError ? (
            <div
              className="dashboard__academic-performance-state dashboard__academic-performance-state--error"
              role="alert"
            >
              {analyticsPeriodsError}
            </div>
          ) : academicPerformanceLoading ? (
            <div className="dashboard__academic-performance-state">
              Loading academic performance...
            </div>
          ) : academicPerformanceError ? (
            <div
              className="dashboard__academic-performance-state dashboard__academic-performance-state--error"
              role="alert"
            >
              {academicPerformanceError}
            </div>
          ) : !academicPerformance ? (
            <div className="dashboard__academic-performance-state">
              {analyticsSessions.length === 0
                ? "No academic sessions are available yet."
                : analyticsTermsForSession.length === 0
                  ? "No terms are configured for this academic session."
                  : "Academic performance data is not available for this period."}
            </div>
          ) : academicPerformance.summary.finalizedDocuments === 0 ? (
            <div className="dashboard__academic-performance-state">
              <strong>No finalized results yet</strong>
              <span>
                Finalized academic results will appear here once they are
                available for {academicPerformance.academicSessionName},{" "}
                {academicPerformance.termName}.
              </span>
            </div>
          ) : (
            <>
              <div className="dashboard__academic-performance-metrics">
                <article className="dashboard__academic-performance-metric">
                  <span>Overall average</span>
                  <strong>
                    {academicPerformance.summary.overallAverage === null
                      ? "—"
                      : `${academicPerformance.summary.overallAverage.toFixed(1)}%`}
                  </strong>
                  <small>Based on available result averages</small>
                </article>

                <article className="dashboard__academic-performance-metric">
                  <span>Finalized results</span>
                  <strong>
                    {academicPerformance.summary.finalizedDocuments.toLocaleString()}
                  </strong>
                  <small>Approved student result documents</small>
                </article>

                <article className="dashboard__academic-performance-metric">
                  <span>Classes represented</span>
                  <strong>
                    {academicPerformance.summary.classesRepresented.toLocaleString()}
                  </strong>
                  <small>Across recorded academic levels</small>
                </article>
              </div>

              <div className="dashboard__academic-performance-details">
                <section className="dashboard__academic-performance-breakdown">
                  <div className="dashboard__academic-performance-section-heading">
                    <div>
                      <h3>Grade distribution</h3>
                      <p>Distribution of available finalized grades</p>
                    </div>
                  </div>

                  {academicPerformance.gradeDistribution.length > 0 ? (
                    <div className="dashboard__academic-performance-grade-list">
                      {academicPerformance.gradeDistribution.map((grade) => (
                        <div
                          className="dashboard__academic-performance-grade"
                          key={grade.grade}
                        >
                          <strong>{grade.grade}</strong>
                          <div className="dashboard__academic-performance-grade-track">
                            <div
                              className="dashboard__academic-performance-grade-fill"
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
                    <p className="dashboard__academic-performance-empty">
                      Grade snapshots are not available for these finalized
                      results.
                    </p>
                  )}
                </section>

                <section className="dashboard__academic-performance-breakdown">
                  <div className="dashboard__academic-performance-section-heading">
                    <div>
                      <h3>Class performance</h3>
                      <p>Average performance by academic level and class</p>
                    </div>
                  </div>

                  {academicPerformance.classPerformance.length > 0 ? (
                    <div className="dashboard__academic-performance-class-list">
                      {academicPerformance.classPerformance.map((item) => (
                        <div
                          className="dashboard__academic-performance-class"
                          key={`${item.academicLevelName}-${item.className}`}
                        >
                          <div>
                            <strong>{item.className}</strong>
                            <span>{item.academicLevelName}</span>
                          </div>

                          <div className="dashboard__academic-performance-class-result">
                            <strong>
                              {item.averagePerformance === null
                                ? "—"
                                : `${item.averagePerformance.toFixed(1)}%`}
                            </strong>
                            <span>
                              {item.documentsWithAverage} of{" "}
                              {item.finalizedDocuments} averages available
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="dashboard__academic-performance-empty">
                      Class snapshot information is not available for these
                      finalized results.
                    </p>
                  )}
                </section>
              </div>

              <p className="dashboard__academic-performance-coverage">
                Data coverage: averages available for{" "}
                {academicPerformance.dataCoverage.documentsWithAverage} of{" "}
                {academicPerformance.dataCoverage.finalizedDocuments} finalized
                results; grades available for{" "}
                {academicPerformance.dataCoverage.documentsWithGrade} of{" "}
                {academicPerformance.dataCoverage.finalizedDocuments}.
              </p>
            </>
          )}
        </section>
      )}

      <div className="dashboard__info">

        <section className="dashboard__panel dashboard__activities">
          <div className="dashboard__panel-heading">
            <div>
              <h2>Recent Activities</h2>
              <p>A quick look at recent school updates</p>
            </div>
          </div>

          {recentActivityPreview.length > 0 ? (
            <div className="dashboard__activity-list">
              {recentActivityPreview.map((item) => (
                <ActivityItem
                  key={item.id}
                  activity={item.activity}
                  time={getRelativeTime(item.createdAt)}
                />
              ))}
            </div>
          ) : (
            <div className="dashboard__empty-state">
              <p>No recent activities yet.</p>
              <span>School updates will appear here as they happen.</span>
            </div>
          )}
        </section>

        <section className="dashboard__panel dashboard__events">
          <div className="dashboard__panel-heading dashboard__section-header">
            <div>
              <h2>Upcoming Events</h2>
              <p>Keep track of important school dates</p>
            </div>

            <button
              type="button"
              onClick={() => setShowEventModal(true)}
            >
              + Add Event
            </button>
          </div>

          {upcomingEventPreview.length > 0 ? (
            <div className="dashboard__event-list">
              {upcomingEventPreview.map((event) => (
                <EventItem
                  key={event.id}
                  title={event.title}
                  date={event.date}
                />
              ))}
            </div>
          ) : (
            <div className="dashboard__empty-state">
              <p>No upcoming events.</p>
              <span>Add an event to keep important dates visible.</span>
            </div>
          )}
        </section>
      </div>

      <section className="dashboard__panel quick-actions">
        <div className="dashboard__panel-heading">
          <div>
            <h2>Quick Actions</h2>
            <p>Jump straight into common school tasks</p>
          </div>
        </div>

        <div className="quick-actions__grid">
          {quickActions.map((action) => (
            <ActionButton
              key={action.id}
              label={action.label}
              path={action.path}
              icon={action.icon}
            />
          ))}
        </div>
      </section>

      {showEventModal && (
        <EventModal
          onClose={() => setShowEventModal(false)}
          onAddEvent={createEvent}
        />
      )}
    </div>
  );
};

export default Dashboard;
