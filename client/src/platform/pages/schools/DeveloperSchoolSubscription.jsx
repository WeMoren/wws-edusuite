import React from "react";
import { Link, useParams } from "react-router-dom";
import "../../styles/developer-school-subscription.css";

const DeveloperSchoolSubscription = () => {
  const { schoolId } = useParams();

  const school = {
    id: schoolId,
    name: "WWS Test School",
    status: "Active",
    subscription: "Trial",
    trialDaysRemaining: 19,
    activeStudents: 0,
    pricePerStudent: 1200,
    minimumAnnualPrice: 60000,
    billingCycle: "Annual",
    startDate: "Sep 1, 2026",
    endDate: "Oct 1, 2026",
    renewalStatus: "Not subscribed",
  };

  const paymentHistory = [];

  const calculatedAmount = Math.max(
    school.activeStudents * school.pricePerStudent,
    school.minimumAnnualPrice
  );

  return (
    <div className="developer-school-subscription">
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

          <h1>Subscription</h1>

          <p>
            View subscription status, billing information, and payment history.
          </p>
        </div>

        <span className="developer-status-badge developer-status-badge--active">
          {school.status}
        </span>
      </header>

      <section className="developer-subscription-overview">
        <article className="developer-panel-card developer-subscription-status-card">
          <div className="developer-panel-card__header">
            <div>
              <h2>Current Subscription</h2>
              <p>Current billing and access state.</p>
            </div>
          </div>

          <div className="developer-subscription-status">
            <span className="developer-subscription-label">
              Subscription Status
            </span>

            <strong>{school.subscription}</strong>

            <p>
              This school currently has full access under the trial period.
            </p>
          </div>
        </article>

        <article className="developer-panel-card">
          <div className="developer-panel-card__header">
            <div>
              <h2>Trial</h2>
              <p>Current trial information.</p>
            </div>
          </div>

          <div className="developer-subscription-highlight">
            <strong>{school.trialDaysRemaining}</strong>
            <span>days remaining</span>
          </div>
        </article>
      </section>

      <section className="developer-details-stats">
        <article className="developer-stat-card">
          <span>Active Students</span>
          <strong>{school.activeStudents}</strong>
          <p>Students currently enrolled</p>
        </article>

        <article className="developer-stat-card">
          <span>Calculated Amount</span>
          <strong>
            ₦{calculatedAmount.toLocaleString()}
          </strong>
          <p>Annual subscription amount</p>
        </article>

        <article className="developer-stat-card">
          <span>Billing Cycle</span>
          <strong>{school.billingCycle}</strong>
          <p>Current billing period</p>
        </article>

        <article className="developer-stat-card">
          <span>Renewal</span>
          <strong>{school.renewalStatus}</strong>
          <p>Current renewal state</p>
        </article>
      </section>

      <section className="developer-subscription-grid">
        <article className="developer-panel-card">
          <div className="developer-panel-card__header">
            <div>
              <h2>Billing Information</h2>
              <p>Subscription pricing and billing details.</p>
            </div>
          </div>

          <div className="developer-details-list">
            <div>
              <span>Price Per Student</span>
              <strong>
                ₦{school.pricePerStudent.toLocaleString()}
              </strong>
            </div>

            <div>
              <span>Minimum Annual Subscription</span>
              <strong>
                ₦{school.minimumAnnualPrice.toLocaleString()}
              </strong>
            </div>

            <div>
              <span>Active Students</span>
              <strong>{school.activeStudents}</strong>
            </div>

            <div>
              <span>Calculated Annual Amount</span>
              <strong className="developer-detail-highlight">
                ₦{calculatedAmount.toLocaleString()}
              </strong>
            </div>

            <div>
              <span>Billing Cycle</span>
              <strong>{school.billingCycle}</strong>
            </div>
          </div>
        </article>

        <article className="developer-panel-card">
          <div className="developer-panel-card__header">
            <div>
              <h2>Subscription Period</h2>
              <p>Current subscription dates and renewal state.</p>
            </div>
          </div>

          <div className="developer-details-list">
            <div>
              <span>Start Date</span>
              <strong>{school.startDate}</strong>
            </div>

            <div>
              <span>End Date</span>
              <strong>{school.endDate}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong className="developer-detail-highlight">
                {school.subscription}
              </strong>
            </div>

            <div>
              <span>Renewal</span>
              <strong>{school.renewalStatus}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="developer-panel-card developer-payment-history">
        <div className="developer-panel-card__header">
          <div>
            <h2>Payment History</h2>
            <p>Subscription payments made by this school.</p>
          </div>
        </div>

        {paymentHistory.length === 0 ? (
          <div className="developer-empty-state">
            <p>No subscription payments recorded yet.</p>
          </div>
        ) : (
          <div className="developer-table-wrapper">
            <table className="developer-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {paymentHistory.map((payment) => (
                  <tr key={payment.reference}>
                    <td>{payment.reference}</td>
                    <td>{payment.amount}</td>
                    <td>{payment.date}</td>
                    <td>{payment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="developer-panel-card developer-subscription-actions">
        <div className="developer-panel-card__header">
          <div>
            <h2>Subscription Actions</h2>
            <p>
              Platform-level administrative actions for this subscription.
            </p>
          </div>
        </div>

        <div className="developer-action-buttons">
          <button type="button">
            Extend Trial
          </button>

          <button type="button">
            Activate Subscription
          </button>

          <button type="button">
            Suspend Subscription
          </button>
        </div>
      </section>
    </div>
  );
};

export default DeveloperSchoolSubscription;