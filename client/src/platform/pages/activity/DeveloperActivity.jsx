import React, { useMemo, useState } from "react";
import "../../styles/developer-activity.css";

const DeveloperActivity = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const activities = [
    {
      id: "ACT-001",
      action: "School Registered",
      description: "WWS Test School was registered on the platform.",
      actor: "System",
      school: "WWS Test School",
      schoolId: "SCH-001",
      status: "Success",
      date: "Sep 1, 2026",
      time: "09:12 AM",
    },
    {
      id: "ACT-002",
      action: "Admin Account Created",
      description: "Administrator account was created for WWS Test School.",
      actor: "System",
      school: "WWS Test School",
      schoolId: "SCH-001",
      status: "Success",
      date: "Sep 1, 2026",
      time: "09:14 AM",
    },
    {
      id: "ACT-003",
      action: "User Login",
      description: "Administrator successfully logged into the school dashboard.",
      actor: "Johnson Smith",
      school: "WWS Test School",
      schoolId: "SCH-001",
      status: "Success",
      date: "Sep 1, 2026",
      time: "09:21 AM",
    },
    {
      id: "ACT-004",
      action: "Teacher Added",
      description: "Teacher account was added to the school.",
      actor: "Johnson Smith",
      school: "WWS Test School",
      schoolId: "SCH-001",
      status: "Success",
      date: "Sep 1, 2026",
      time: "10:05 AM",
    },
    {
      id: "ACT-005",
      action: "School Registered",
      description: "Second WWS Test School was registered on the platform.",
      actor: "System",
      school: "Second WWS Test School",
      schoolId: "SCH-002",
      status: "Success",
      date: "Sep 3, 2026",
      time: "11:18 AM",
    },
    {
      id: "ACT-006",
      action: "Admin Account Created",
      description: "Administrator account was created for Second WWS Test School.",
      actor: "System",
      school: "Second WWS Test School",
      schoolId: "SCH-002",
      status: "Success",
      date: "Sep 3, 2026",
      time: "11:20 AM",
    },
    {
      id: "ACT-007",
      action: "User Login",
      description: "Administrator successfully logged into the school dashboard.",
      actor: "David Okafor",
      school: "Second WWS Test School",
      schoolId: "SCH-002",
      status: "Success",
      date: "Sep 3, 2026",
      time: "11:42 AM",
    },
    {
      id: "ACT-008",
      action: "School Registered",
      description: "Registration Test School was registered on the platform.",
      actor: "System",
      school: "Registration Test School",
      schoolId: "SCH-003",
      status: "Success",
      date: "Sep 5, 2026",
      time: "02:31 PM",
    },
    {
      id: "ACT-009",
      action: "Admin Account Created",
      description: "Administrator account was created for Registration Test School.",
      actor: "System",
      school: "Registration Test School",
      schoolId: "SCH-003",
      status: "Success",
      date: "Sep 5, 2026",
      time: "02:33 PM",
    },
    {
      id: "ACT-010",
      action: "User Login Failed",
      description: "A login attempt failed because the supplied credentials were invalid.",
      actor: "Unknown User",
      school: "Registration Test School",
      schoolId: "SCH-003",
      status: "Failed",
      date: "Sep 5, 2026",
      time: "03:07 PM",
    },
    {
      id: "ACT-011",
      action: "Trial Started",
      description: "The school's 30-day trial period was started.",
      actor: "System",
      school: "Registration Test School",
      schoolId: "SCH-003",
      status: "Success",
      date: "Sep 5, 2026",
      time: "03:10 PM",
    },
  ];

  const actionOptions = [
    "All",
    "School Registered",
    "Admin Account Created",
    "User Login",
    "User Login Failed",
    "Teacher Added",
    "Trial Started",
  ];

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch =
        activity.id
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        activity.action
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        activity.actor
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        activity.school
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesAction =
        actionFilter === "All" ||
        activity.action === actionFilter;

      const matchesStatus =
        statusFilter === "All" ||
        activity.status === statusFilter;

      return (
        matchesSearch &&
        matchesAction &&
        matchesStatus
      );
    });
  }, [
    activities,
    searchTerm,
    actionFilter,
    statusFilter,
  ]);

  const successfulActivities = activities.filter(
    (activity) => activity.status === "Success"
  ).length;

  const failedActivities = activities.filter(
    (activity) => activity.status === "Failed"
  ).length;

  const uniqueSchools = new Set(
    activities.map((activity) => activity.schoolId)
  ).size;

  return (
    <div className="developer-activity">
      <header className="developer-page-header">
        <div>
          <p className="developer-page-header__eyebrow">
            Platform Monitoring
          </p>

          <h1>Activity Log</h1>

          <p>
            Monitor activity and important events across the
            WWS-EduSuite platform.
          </p>
        </div>
      </header>

      <section className="developer-stats">
        <article className="developer-stat-card">
          <span>Total Activities</span>
          <strong>{activities.length}</strong>
          <p>Recorded platform events</p>
        </article>

        <article className="developer-stat-card">
          <span>Successful</span>
          <strong>{successfulActivities}</strong>
          <p>Completed successfully</p>
        </article>

        <article className="developer-stat-card">
          <span>Failed</span>
          <strong>{failedActivities}</strong>
          <p>Events requiring attention</p>
        </article>

        <article className="developer-stat-card">
          <span>Schools Affected</span>
          <strong>{uniqueSchools}</strong>
          <p>Schools with recorded activity</p>
        </article>
      </section>

      <section className="developer-panel-card developer-activity-panel">
        <div className="developer-panel-card__header">
          <div>
            <h2>Platform Activity</h2>
            <p>
              Recent events recorded across all registered schools.
            </p>
          </div>
        </div>

        <div className="developer-activity-toolbar">
          <div className="developer-search">
            <input
              type="text"
              placeholder="Search activity..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>

          <select
            value={actionFilter}
            onChange={(event) =>
              setActionFilter(event.target.value)
            }
          >
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {action === "All"
                  ? "All Actions"
                  : action}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="All">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <div className="developer-table-wrapper">
          <table className="developer-table">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Activity ID</th>
                <th>School</th>
                <th>Actor</th>
                <th>Status</th>
                <th>Date & Time</th>
              </tr>
            </thead>

            <tbody>
              {filteredActivities.map((activity) => (
                <tr key={activity.id}>
                  <td>
                    <div className="developer-activity-name">
                      <strong>{activity.action}</strong>
                      <span>{activity.description}</span>
                    </div>
                  </td>

                  <td>{activity.id}</td>

                  <td>
                    <div className="developer-activity-school">
                      <strong>{activity.school}</strong>
                      <span>{activity.schoolId}</span>
                    </div>
                  </td>

                  <td>{activity.actor}</td>

                  <td>
                    <span
                      className={`developer-status-badge developer-status-badge--${activity.status.toLowerCase()}`}
                    >
                      {activity.status}
                    </span>
                  </td>

                  <td>
                    <div className="developer-activity-time">
                      <strong>{activity.date}</strong>
                      <span>{activity.time}</span>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredActivities.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="developer-table-empty"
                  >
                    No activity matches your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DeveloperActivity;