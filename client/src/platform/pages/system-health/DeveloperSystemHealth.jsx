import React from "react";
import "../../styles/developer-system-health.css";

const DeveloperSystemHealth = () => {
  const services = [
    {
      id: "SYS-001",
      service: "Frontend Application",
      description: "WWS-EduSuite client application",
      status: "Operational",
      response: "12 ms",
      lastChecked: "Just now",
    },
    {
      id: "SYS-002",
      service: "Backend API",
      description: "Node.js / Express REST API",
      status: "Operational",
      response: "28 ms",
      lastChecked: "Just now",
    },
    {
      id: "SYS-003",
      service: "PostgreSQL Database",
      description: "Primary application database",
      status: "Operational",
      response: "18 ms",
      lastChecked: "Just now",
    },
    {
      id: "SYS-004",
      service: "Authentication Service",
      description: "JWT and password authentication",
      status: "Operational",
      response: "31 ms",
      lastChecked: "Just now",
    },
    {
      id: "SYS-005",
      service: "Subscription Service",
      description: "Trial and subscription management",
      status: "Development",
      response: "—",
      lastChecked: "Not connected",
    },
    {
      id: "SYS-006",
      service: "Payment Service",
      description: "Paystack payment integration",
      status: "Development",
      response: "—",
      lastChecked: "Not connected",
    },
  ];

  const operationalServices = services.filter(
    (service) => service.status === "Operational"
  ).length;

  const developmentServices = services.filter(
    (service) => service.status === "Development"
  ).length;

  const environmentItems = [
    {
      label: "Application Environment",
      value: "Development",
    },
    {
      label: "Frontend",
      value: "React / Vite",
    },
    {
      label: "Backend",
      value: "Node.js / Express",
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
      label: "Payment Provider",
      value: "Paystack — Pending",
    },
  ];

  return (
    <div className="developer-system-health">
      <header className="developer-page-header">
        <div>
          <p className="developer-page-header__eyebrow">
            Platform Monitoring
          </p>

          <h1>System Health</h1>

          <p>
            Monitor the availability and status of core
            WWS-EduSuite services.
          </p>
        </div>

        <div className="developer-health-overall">
          <span className="developer-health-dot" />
          <div>
            <strong>System Operational</strong>
            <span>All connected services are running normally.</span>
          </div>
        </div>
      </header>

      <section className="developer-stats">
        <article className="developer-stat-card">
          <span>Total Services</span>
          <strong>{services.length}</strong>
          <p>Registered platform services</p>
        </article>

        <article className="developer-stat-card">
          <span>Operational</span>
          <strong>{operationalServices}</strong>
          <p>Services currently responding</p>
        </article>

        <article className="developer-stat-card">
          <span>Development</span>
          <strong>{developmentServices}</strong>
          <p>Services awaiting integration</p>
        </article>

        <article className="developer-stat-card">
          <span>Last Checked</span>
          <strong>Now</strong>
          <p>Development health snapshot</p>
        </article>
      </section>

      <section className="developer-health-grid">
        <div className="developer-panel-card developer-health-services">
          <div className="developer-panel-card__header">
            <div>
              <h2>Service Status</h2>
              <p>
                Current status of platform services and
                infrastructure.
              </p>
            </div>
          </div>

          <div className="developer-table-wrapper">
            <table className="developer-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Response</th>
                  <th>Last Checked</th>
                </tr>
              </thead>

              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <div className="developer-health-service">
                        <strong>{service.service}</strong>
                        <span>{service.description}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`developer-health-status developer-health-status--${service.status.toLowerCase()}`}
                      >
                        <span className="developer-health-status-dot" />
                        {service.status}
                      </span>
                    </td>

                    <td>{service.response}</td>

                    <td>{service.lastChecked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="developer-panel-card developer-environment-panel">
          <div className="developer-panel-card__header">
            <div>
              <h2>Environment</h2>
              <p>
                Current platform development configuration.
              </p>
            </div>
          </div>

          <div className="developer-environment-list">
            {environmentItems.map((item) => (
              <div
                className="developer-environment-item"
                key={item.label}
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="developer-panel-card developer-health-note">
        <div className="developer-health-note-icon">i</div>

        <div>
          <h2>Development Monitoring</h2>

          <p>
            System health is currently using development
            status data. Once platform monitoring is connected
            to the backend, these checks will report live API,
            database, authentication, subscription, and payment
            service health.
          </p>
        </div>
      </section>
    </div>
  );
};

export default DeveloperSystemHealth;