import React from "react";

const DeveloperOverview = () => {
  const stats = [
    {
      label: "Total Schools",
      value: "0",
      description: "Schools registered on WWS-EduSuite",
    },
    {
      label: "Active Schools",
      value: "0",
      description: "Schools currently active",
    },
    {
      label: "Trial Schools",
      value: "0",
      description: "Schools currently on trial",
    },
    {
      label: "Total Students",
      value: "0",
      description: "Students across all schools",
    },
  ];

  return (
    <div className="developer-overview">
      <header className="developer-page-header">
        <div>
          <p className="developer-page-header__eyebrow">
            Platform
          </p>

          <h1>Developer Control Panel</h1>

          <p>
            Monitor and manage the WWS-EduSuite platform.
          </p>
        </div>
      </header>

      <section className="developer-stats">
        {stats.map((stat) => (
          <article
            className="developer-stat-card"
            key={stat.label}
          >
            <span>{stat.label}</span>

            <strong>{stat.value}</strong>

            <p>{stat.description}</p>
          </article>
        ))}
      </section>

      <section className="developer-overview-grid">
        <article className="developer-panel-card">
          <div className="developer-panel-card__header">
            <div>
              <h2>Recent Schools</h2>
              <p>Recently registered schools.</p>
            </div>
          </div>

          <div className="developer-empty-state">
            <p>No schools registered yet.</p>
          </div>
        </article>

        <article className="developer-panel-card">
          <div className="developer-panel-card__header">
            <div>
              <h2>Platform Activity</h2>
              <p>Recent activity across the platform.</p>
            </div>
          </div>

          <div className="developer-empty-state">
            <p>No recent platform activity.</p>
          </div>
        </article>
      </section>

      <section className="developer-system-status">
        <article className="developer-panel-card">
          <div className="developer-panel-card__header">
            <div>
              <h2>System Status</h2>
              <p>Core platform services.</p>
            </div>
          </div>

          <div className="developer-status-list">
            <div className="developer-status-item">
              <span>Frontend</span>
              <strong>Development</strong>
            </div>

            <div className="developer-status-item">
              <span>Backend API</span>
              <strong>Development</strong>
            </div>

            <div className="developer-status-item">
              <span>PostgreSQL</span>
              <strong>Development</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default DeveloperOverview;
