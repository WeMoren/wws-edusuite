import React from "react";
import { Link, useParams } from "react-router-dom";
import "../../styles/developer-school-activity.css";

const DeveloperSchoolActivity = () => {
  const { schoolId } = useParams();

  const school = {
    id: schoolId,
    name: "WWS Test School",
  };

  const activities = [
    {
      id: "ACT-001",
      action: "School registered",
      description: "School account was created on the platform.",
      actor: "Platform",
      date: "Sep 1, 2026",
      time: "09:15 AM",
      status: "Success",
    },
    {
      id: "ACT-002",
      action: "Admin account created",
      description: "The initial school administrator account was created.",
      actor: "Platform",
      date: "Sep 1, 2026",
      time: "09:16 AM",
      status: "Success",
    },
    {
      id: "ACT-003",
      action: "Trial started",
      description: "The school's 30-day trial period was activated.",
      actor: "System",
      date: "Sep 1, 2026",
      time: "09:16 AM",
      status: "Success",
    },
    {
      id: "ACT-004",
      action: "Teacher account added",
      description: "A teacher account was added to the school.",
      actor: "Admin",
      date: "Sep 1, 2026",
      time: "10:42 AM",
      status: "Success",
    },
    {
      id: "ACT-005",
      action: "Admin login",
      description: "School administrator successfully signed in.",
      actor: "Johnson Smith",
      date: "Sep 6, 2026",
      time: "08:31 AM",
      status: "Success",
    },
  ];

  return (
    <div className="developer-school-activity">
      <Link
        to={`/platform/schools/${schoolId}`}
        className="developer-back-link"
      >
        ← Back to School
      </Link>

      <header className="developer-page-header">
        <div>
          <p className="developer-page-header__eyebrow">
            {school.name}
          </p>

          <h1>Activity</h1>

          <p>
            View recent platform and administrative activity for this school.
          </p>
        </div>
      </header>

      <section className="developer-stats">
        <article className="developer-stat-card">
          <span>Total Activities</span>
          <strong>{activities.length}</strong>
          <p>Recorded school activity</p>
        </article>

        <article className="developer-stat-card">
          <span>Successful</span>
          <strong>
            {activities.filter(
              (activity) => activity.status === "Success"
            ).length}
          </strong>
          <p>Successfully completed actions</p>
        </article>

        <article className="developer-stat-card">
          <span>School ID</span>
          <strong>{school.id}</strong>
          <p>Platform school identifier</p>
        </article>
      </section>

      <section className="developer-panel-card developer-school-activity-panel">
        <div className="developer-panel-card__header">
          <div>
            <h2>Activity History</h2>
            <p>
              Recent events associated with this school.
            </p>
          </div>
        </div>

        <div className="developer-activity-list">
          {activities.map((activity) => (
            <article
              className="developer-activity-item"
              key={activity.id}
            >
              <div className="developer-activity-marker" />

              <div className="developer-activity-content">
                <div className="developer-activity-top">
                  <div>
                    <h3>{activity.action}</h3>
                    <p>{activity.description}</p>
                  </div>

                  <span className="developer-status-badge developer-status-badge--active">
                    {activity.status}
                  </span>
                </div>

                <div className="developer-activity-meta">
                  <span>Actor: {activity.actor}</span>
                  <span>
                    {activity.date} · {activity.time}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DeveloperSchoolActivity;