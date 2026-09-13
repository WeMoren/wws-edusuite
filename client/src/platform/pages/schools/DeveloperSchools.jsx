import React, { useMemo, useState } from "react";
import "../../styles/developer-schools.css";
import { Link } from "react-router-dom";

const DeveloperSchools = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const schools = [
    {
      id: "SCH-001",
      name: "WWS Test School",
      email: "admin@wwstestschool.com",
      status: "Active",
      subscription: "Trial",
      students: 0,
      registered: "Sep 1, 2026",
    },
    {
      id: "SCH-002",
      name: "Second WWS Test School",
      email: "admin@secondwwstestschool.com",
      status: "Active",
      subscription: "Trial",
      students: 0,
      registered: "Sep 3, 2026",
    },
    {
      id: "SCH-003",
      name: "Registration Test School",
      email: "admin@registrationtestschool.com",
      status: "Active",
      subscription: "Trial",
      students: 0,
      registered: "Sep 5, 2026",
    },
  ];

  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      const matchesSearch =
        school.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        school.email
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        school.id
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        school.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const totalSchools = schools.length;

  const activeSchools = schools.filter(
    (school) => school.status === "Active"
  ).length;

  const trialSchools = schools.filter(
    (school) => school.subscription === "Trial"
  ).length;

  const suspendedSchools = schools.filter(
    (school) => school.status === "Suspended"
  ).length;

  return (
    <div className="developer-schools">
      <header className="developer-page-header">
        <div>
          <p className="developer-page-header__eyebrow">
            Platform
          </p>

          <h1>Schools</h1>

          <p>
            View and manage schools registered on WWS-EduSuite.
          </p>
        </div>
      </header>

      <section className="developer-stats">
        <article className="developer-stat-card">
          <span>Total Schools</span>
          <strong>{totalSchools}</strong>
          <p>Schools registered on the platform</p>
        </article>

        <article className="developer-stat-card">
          <span>Active Schools</span>
          <strong>{activeSchools}</strong>
          <p>Schools currently active</p>
        </article>

        <article className="developer-stat-card">
          <span>Trial Schools</span>
          <strong>{trialSchools}</strong>
          <p>Schools currently on trial</p>
        </article>

        <article className="developer-stat-card">
          <span>Suspended Schools</span>
          <strong>{suspendedSchools}</strong>
          <p>Schools currently suspended</p>
        </article>
      </section>

      <section className="developer-panel-card developer-schools-panel">
        <div className="developer-panel-card__header">
          <div>
            <h2>Registered Schools</h2>
            <p>
              All schools currently registered on the platform.
            </p>
          </div>
        </div>

        <div className="developer-schools-toolbar">
          <div className="developer-schools-search">
            <input
              type="search"
              placeholder="Search schools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="developer-schools-filter">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
        </div>

        <div className="developer-table-wrapper">
          <table className="developer-table">
            <thead className="developer-table-heading">
              <tr>
                <th>School</th>
                <th>School ID</th>
                <th>Status</th>
                <th>Subscription</th>
                <th>Students</th>
                <th>Registered</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody className="developer-table-body">
              {filteredSchools.length > 0 ? (
                filteredSchools.map((school) => (
                  <tr key={school.id}>
                    <td>
                      <div className="developer-school-name">
                        <strong>{school.name}</strong>
                        <span>{school.email}</span>
                      </div>
                    </td>

                    <td>{school.id}</td>

                    <td>
                      <span
                        className={`developer-status-badge developer-status-badge--${school.status.toLowerCase()}`}
                      >
                        {school.status}
                      </span>
                    </td>

                    <td>
                      <span className="developer-subscription-badge">
                        {school.subscription}
                      </span>
                    </td>

                    <td>{school.students}</td>

                    <td>{school.registered}</td>

                    <td>
                        <Link
                            to={`/platform/schools/${school.id}`}
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
                    colSpan="7"
                    className="developer-table-empty"
                  >
                    No schools match your search.
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

export default DeveloperSchools;