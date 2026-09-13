import React from "react";
import "../../styles/developer-development.css";

const DeveloperDevelopment = () => {
  const environment = [
    {
      label: "Application Environment",
      value: "Development",
    },
    {
      label: "Frontend",
      value: "React + Vite",
    },
    {
      label: "Backend",
      value: "Node.js + Express",
    },
    {
      label: "Database",
      value: "PostgreSQL",
    },
    {
      label: "Authentication",
      value: "JWT + Argon2id",
    },
    {
      label: "Version Control",
      value: "Git + GitHub",
    },
  ];

  const integrations = [
    {
      name: "PostgreSQL",
      description: "Primary application database",
      status: "Connected",
    },
    {
      name: "Backend API",
      description: "Express REST API",
      status: "Connected",
    },
    {
      name: "Authentication",
      description: "JWT access-token authentication",
      status: "Implemented",
    },
    {
      name: "Paystack",
      description: "Subscription payment processing",
      status: "Pending",
    },
    {
      name: "Refresh Tokens",
      description: "Long-lived secure session management",
      status: "Pending",
    },
    {
      name: "Production Monitoring",
      description: "Live infrastructure monitoring",
      status: "Pending",
    },
  ];

  const developmentAreas = [
    {
      title: "School Registration",
      description:
        "School and administrator registration through the backend API.",
      status: "Implemented",
    },
    {
      title: "Staff Authentication",
      description:
        "Role-based authentication and protected school resources.",
      status: "Implemented",
    },
    {
      title: "Subscription Management",
      description:
        "Trial periods, subscription states, billing periods, and payment history.",
      status: "In Development",
    },
    {
      title: "Payment Integration",
      description:
        "Paystack checkout, payment verification, and webhook processing.",
      status: "Pending",
    },
    {
      title: "Platform Audit Logging",
      description:
        "Persistent activity records for platform and school events.",
      status: "In Development",
    },
    {
      title: "Production Deployment",
      description:
        "Production infrastructure, environment configuration, and monitoring.",
      status: "Pending",
    },
  ];

  return (
    <div className="developer-development">
      <header className="developer-page-header">
        <div>
          <p className="developer-page-header__eyebrow">
            Platform Engineering
          </p>

          <h1>Development</h1>

          <p>
            Development environment, architecture, integrations,
            and implementation progress for WWS-EduSuite.
          </p>
        </div>

        <div className="developer-development-badge">
          <span />
          Development Environment
        </div>
      </header>

      <section className="developer-stats">
        <article className="developer-stat-card">
          <span>Frontend</span>
          <strong>React</strong>
          <p>Vite application</p>
        </article>

        <article className="developer-stat-card">
          <span>Backend</span>
          <strong>Express</strong>
          <p>Node.js REST API</p>
        </article>

        <article className="developer-stat-card">
          <span>Database</span>
          <strong>PostgreSQL</strong>
          <p>Primary data store</p>
        </article>

        <article className="developer-stat-card">
          <span>Branch</span>
          <strong>master</strong>
          <p>Current Git branch</p>
        </article>
      </section>

      <section className="developer-development-grid">
        <div className="developer-panel-card developer-environment-card">
          <div className="developer-panel-card__header">
            <div>
              <h2>Environment</h2>
              <p>
                Current development stack and infrastructure.
              </p>
            </div>
          </div>

          <div className="developer-development-list">
            {environment.map((item) => (
              <div
                className="developer-development-item"
                key={item.label}
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="developer-panel-card developer-integrations-card">
          <div className="developer-panel-card__header">
            <div>
              <h2>Integrations</h2>
              <p>
                Current platform services and integrations.
              </p>
            </div>
          </div>

          <div className="developer-integration-list">
            {integrations.map((integration) => (
              <div
                className="developer-integration-item"
                key={integration.name}
              >
                <div>
                  <strong>{integration.name}</strong>
                  <span>{integration.description}</span>
                </div>

                <span
                  className={`developer-development-status developer-development-status--${integration.status
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}
                >
                  {integration.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="developer-panel-card developer-progress-card">
        <div className="developer-panel-card__header">
          <div>
            <h2>Development Progress</h2>
            <p>
              Major platform engineering areas and their current
              implementation state.
            </p>
          </div>
        </div>

        <div className="developer-progress-list">
          {developmentAreas.map((area) => (
            <article
              className="developer-progress-item"
              key={area.title}
            >
              <div className="developer-progress-content">
                <h3>{area.title}</h3>
                <p>{area.description}</p>
              </div>

              <span
                className={`developer-development-status developer-development-status--${area.status
                  .toLowerCase()
                  .replaceAll(" ", "-")}`}
              >
                {area.status}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="developer-panel-card developer-development-note">
        <div className="developer-development-note-icon">
          &lt;/&gt;
        </div>

        <div>
          <h2>Development Mode</h2>

          <p>
            This section is intended for platform development and
            internal monitoring. Production credentials, secrets,
            database passwords, and private infrastructure details
            must never be exposed through the developer interface.
          </p>
        </div>
      </section>
    </div>
  );
};

export default DeveloperDevelopment;