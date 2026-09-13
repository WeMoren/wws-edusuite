import React from "react";
import { Link, useParams } from "react-router-dom";
import "../../styles/developer-school-users.css";

const DeveloperSchoolUsers = () => {
  const { schoolId } = useParams();

  const school = {
    id: schoolId,
    name: "WWS Test School",
  };

  const users = [
    {
      id: "USR-001",
      name: "Johnson Smith",
      email: "admin@wwstestschool.com",
      role: "Admin",
      status: "Active",
      joined: "Sep 1, 2026",
    },
    {
      id: "USR-002",
      name: "John Doe",
      email: "teacher@wwstestschool.com",
      role: "Teacher",
      status: "Active",
      joined: "Sep 1, 2026",
    },
    {
      id: "USR-003",
      name: "Sarah Williams",
      email: "accountant@wwstestschool.com",
      role: "Accountant",
      status: "Active",
      joined: "Sep 1, 2026",
    },
    {
      id: "USR-004",
      name: "Michael Brown",
      email: "examofficer@wwstestschool.com",
      role: "Exam Officer",
      status: "Active",
      joined: "Sep 1, 2026",
    },
  ];

  const activeUsers = users.filter(
    (user) => user.status === "Active"
  ).length;

  const inactiveUsers = users.filter(
    (user) => user.status === "Inactive"
  ).length;

  return (
    <div className="developer-school-users">
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

          <h1>Users & Staff</h1>

          <p>
            View staff accounts and roles belonging to this school.
          </p>
        </div>
      </header>

      <section className="developer-stats">
        <article className="developer-stat-card">
          <span>Total Users</span>
          <strong>{users.length}</strong>
          <p>Registered school accounts</p>
        </article>

        <article className="developer-stat-card">
          <span>Active Users</span>
          <strong>{activeUsers}</strong>
          <p>Currently active accounts</p>
        </article>

        <article className="developer-stat-card">
          <span>Inactive Users</span>
          <strong>{inactiveUsers}</strong>
          <p>Currently inactive accounts</p>
        </article>

        <article className="developer-stat-card">
          <span>School ID</span>
          <strong>{school.id}</strong>
          <p>Platform school identifier</p>
        </article>
      </section>

      <section className="developer-panel-card developer-users-panel">
        <div className="developer-panel-card__header">
          <div>
            <h2>School Users</h2>
            <p>
              Staff accounts currently associated with this school.
            </p>
          </div>
        </div>

        <div className="developer-table-wrapper">
          <table className="developer-table">
            <thead>
              <tr>
                <th>User</th>
                <th>User ID</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="developer-user-name">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                  </td>

                  <td>{user.id}</td>

                  <td>
                    <span className="developer-role-badge">
                      {user.role}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`developer-status-badge developer-status-badge--${user.status.toLowerCase()}`}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td>{user.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DeveloperSchoolUsers;