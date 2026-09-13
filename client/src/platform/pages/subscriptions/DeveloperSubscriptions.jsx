import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/developer-subscriptions.css";

const DeveloperSubscriptions = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const subscriptions = [
    {
      id: "SUB-001",
      schoolId: "SCH-001",
      school: "WWS Test School",
      status: "Trial",
      students: 0,
      amount: 60000,
      billingCycle: "Annual",
      startDate: "Sep 1, 2026",
      endDate: "Oct 1, 2026",
      renewal: "Not subscribed",
    },
    {
      id: "SUB-002",
      schoolId: "SCH-002",
      school: "Second WWS Test School",
      status: "Trial",
      students: 0,
      amount: 60000,
      billingCycle: "Annual",
      startDate: "Sep 3, 2026",
      endDate: "Oct 3, 2026",
      renewal: "Not subscribed",
    },
    {
      id: "SUB-003",
      schoolId: "SCH-003",
      school: "Registration Test School",
      status: "Trial",
      students: 0,
      amount: 60000,
      billingCycle: "Annual",
      startDate: "Sep 5, 2026",
      endDate: "Oct 5, 2026",
      renewal: "Not subscribed",
    },
  ];

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((subscription) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        subscription.school.toLowerCase().includes(searchValue) ||
        subscription.schoolId.toLowerCase().includes(searchValue) ||
        subscription.id.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        subscription.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const totalSubscriptions = subscriptions.length;

  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "Active"
  ).length;

  const trialSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "Trial"
  ).length;

  const expiredSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.status === "Expired" ||
      subscription.status === "Suspended"
  ).length;

  const totalAnnualValue = subscriptions.reduce(
    (total, subscription) => total + subscription.amount,
    0
  );

  return (
    <div className="developer-subscriptions">
      <header className="developer-page-header">
        <div>
          <p className="developer-page-header__eyebrow">
            Platform
          </p>

          <h1>Subscriptions</h1>

          <p>
            Monitor subscription status and billing across all schools.
          </p>
        </div>
      </header>

      <section className="developer-stats">
        <article className="developer-stat-card">
          <span>Total Subscriptions</span>
          <strong>{totalSubscriptions}</strong>
          <p>Schools with subscription records</p>
        </article>

        <article className="developer-stat-card">
          <span>Active</span>
          <strong>{activeSubscriptions}</strong>
          <p>Schools with active subscriptions</p>
        </article>

        <article className="developer-stat-card">
          <span>Trial</span>
          <strong>{trialSubscriptions}</strong>
          <p>Schools currently on trial</p>
        </article>

        <article className="developer-stat-card">
          <span>Expired / Suspended</span>
          <strong>{expiredSubscriptions}</strong>
          <p>Subscriptions requiring attention</p>
        </article>
      </section>

      <section className="developer-panel-card developer-subscriptions-summary">
        <div>
          <span>Current Annual Subscription Value</span>

          <strong>
            ₦{totalAnnualValue.toLocaleString()}
          </strong>

          <p>
            Based on the current subscription amounts across registered schools.
          </p>
        </div>
      </section>

      <section className="developer-panel-card developer-subscriptions-panel">
        <div className="developer-panel-card__header">
          <div>
            <h2>School Subscriptions</h2>

            <p>
              All subscription records currently registered on the platform.
            </p>
          </div>
        </div>

        <div className="developer-subscriptions-toolbar">
          <div className="developer-subscriptions-search">
            <input
              type="search"
              placeholder="Search schools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="developer-subscriptions-filter">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="developer-table-wrapper">
          <table className="developer-table">
            <thead>
              <tr>
                <th>School</th>
                <th>Subscription</th>
                <th>Students</th>
                <th>Amount</th>
                <th>Billing</th>
                <th>Period</th>
                <th>Renewal</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredSubscriptions.length > 0 ? (
                filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td>
                      <div className="developer-subscription-school">
                        <strong>{subscription.school}</strong>
                        <span>{subscription.schoolId}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`developer-status-badge developer-status-badge--${subscription.status.toLowerCase()}`}
                      >
                        {subscription.status}
                      </span>
                    </td>

                    <td>{subscription.students}</td>

                    <td>
                      ₦{subscription.amount.toLocaleString()}
                    </td>

                    <td>{subscription.billingCycle}</td>

                    <td>
                      <div className="developer-subscription-period">
                        <span>{subscription.startDate}</span>
                        <small>to {subscription.endDate}</small>
                      </div>
                    </td>

                    <td>{subscription.renewal}</td>

                    <td>
                      <Link
                        to={`/platform/schools/${subscription.schoolId}/subscription`}
                        className="developer-table-action"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="developer-table-empty"
                  >
                    No subscriptions match your search.
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

export default DeveloperSubscriptions;