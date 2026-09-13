import React from "react";
import { Link, useParams } from "react-router-dom";
import "../../styles/developer-school-details.css";

const DeveloperSchoolDetails = () => {
  const { schoolId } = useParams();

  const schools = [
    {
      id: "SCH-001",
      name: "WWS Test School",
      email: "admin@wwstestschool.com",
      phone: "Not provided",
      status: "Active",
      subscription: "Trial",
      students: 0,
      staff: 1,
      registered: "Sep 1, 2026",
      trialDaysRemaining: 19,
    },
    {
      id: "SCH-002",
      name: "Second WWS Test School",
      email: "admin@secondwwstestschool.com",
      phone: "Not provided",
      status: "Active",
      subscription: "Trial",
      students: 0,
      staff: 1,
      registered: "Sep 3, 2026",
      trialDaysRemaining: 21,
    },
    {
      id: "SCH-003",
      name: "Registration Test School",
      email: "admin@registrationtestschool.com",
      phone: "Not provided",
      status: "Active",
      subscription: "Trial",
      students: 0,
      staff: 1,
      registered: "Sep 5, 2026",
      trialDaysRemaining: 23,
    },
  ];

  const school = schools.find(
    (item) => item.id === schoolId
  );

  if (!school) {
    return (
      <div className="developer-school-details">
        <Link
          to="/platform/schools"
          className="developer-back-link"
        >
          ← Back to Schools
        </Link>

        <section className="developer-panel-card developer-details-not-found">
          <h1>School Not Found</h1>
          <p>
            The requested school could not be found.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="developer-school-details">
      <Link
        to="/platform/schools"
        className="developer-back-link"
      >
        ← Back to Schools
      </Link>

      <header className="developer-page-header developer-details-header">
        <div>
          <p className="developer-page-header__eyebrow">
            School
          </p>

          <h1>{school.name}</h1>

          <p>
            Platform details and subscription information.
          </p>
        </div>

        <span className="developer-status-badge developer-status-badge--active">
          {school.status}
        </span>
      </header>

      <section className="developer-details-grid">
        <article className="developer-panel-card">
          <div className="developer-panel-card__header">
            <div>
              <h2>School Profile</h2>
              <p>Basic information about the school.</p>
            </div>
          </div>

          <div className="developer-details-list">
            <div>
              <span>School Name</span>
              <strong>{school.name}</strong>
            </div>

            <div>
              <span>School ID</span>
              <strong>{school.id}</strong>
            </div>

            <div>
              <span>Admin Email</span>
              <strong>{school.email}</strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>{school.phone}</strong>
            </div>

            <div>
              <span>Registered</span>
              <strong>{school.registered}</strong>
            </div>
          </div>
        </article>

        <article className="developer-panel-card">
          <div className="developer-panel-card__header">
            <div>
              <h2>Subscription</h2>
              <p>Current subscription status.</p>
            </div>
          </div>

          <div className="developer-details-list">
            <div>
              <span>Status</span>

              <strong className="developer-detail-highlight">
                {school.subscription}
              </strong>
            </div>

            <div>
              <span>Trial Remaining</span>
              <strong>
                {school.trialDaysRemaining} days
              </strong>
            </div>

            <div>
              <span>Billing</span>
              <strong>Not subscribed</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="developer-details-stats">
        <article className="developer-stat-card">
          <span>Students</span>
          <strong>{school.students}</strong>
          <p>Currently enrolled students</p>
        </article>

        <article className="developer-stat-card">
          <span>Staff</span>
          <strong>{school.staff}</strong>
          <p>Registered school staff</p>
        </article>

        <article className="developer-stat-card">
          <span>Subscription</span>
          <strong>{school.subscription}</strong>
          <p>Current subscription state</p>
        </article>

        <article className="developer-stat-card">
          <span>Trial</span>
          <strong>{school.trialDaysRemaining}</strong>
          <p>Days remaining</p>
        </article>
      </section>

      <section className="developer-panel-card developer-school-actions">
        <div className="developer-panel-card__header">
          <div>
            <h2>Platform Actions</h2>
            <p>
              Administrative actions for this school.
            </p>
          </div>
        </div>

        <div className="developer-action-buttons">
            <Link
              to={`/platform/schools/${schoolId}/users`}
              className="developer-action-button"
            >
              View Users & Staff
            </Link>
         <Link
          to={`/platform/schools/${schoolId}/activity`}
          className="developer-action-button"
        >
          View Activity
        </Link>

      <Link
          to={`/platform/schools/${schoolId}/subscription`}
          className="developer-action-button"
        >
          View Subscription
      </Link>
                
        </div>
      </section>
    </div>
  );
};

export default DeveloperSchoolDetails;