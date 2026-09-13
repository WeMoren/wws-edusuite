import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/developer-users.css";

const DeveloperUsers = () => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("all");

  const users = [
    {
      id: "USR-001",
      name: "Johnson Smith",
      email: "admin@wwstestschool.com",
      role: "Admin",
      status: "Active",
      schoolId: "SCH-001",
      school: "WWS Test School",
      joined: "Sep 1, 2026",
    },
    {
      id: "USR-002",
      name: "John Doe",
      email: "teacher@wwstestschool.com",
      role: "Teacher",
      status: "Active",
      schoolId: "SCH-001",
      school: "WWS Test School",
      joined: "Sep 1, 2026",
    },
    {
      id: "USR-003",
      name: "Sarah Williams",
      email: "accountant@wwstestschool.com",
      role: "Accountant",
      status: "Active",
      schoolId: "SCH-001",
      school: "WWS Test School",
      joined: "Sep 1, 2026",
    },
    {
      id: "USR-004",
      name: "Michael Brown",
      email: "examofficer@wwstestschool.com",
      role: "Exam Officer",
      status: "Active",
      schoolId: "SCH-001",
      school: "WWS Test School",
      joined: "Sep 1, 2026",
    },
    {
      id: "USR-005",
      name: "David Okafor",
      email: "admin@secondwwstestschool.com",
      role: "Admin",
      status: "Active",
      schoolId: "SCH-002",
      school: "Second WWS Test School",
      joined: "Sep 3, 2026",
    },
    {
      id: "USR-006",
      name: "Grace Eze",
      email: "teacher@secondwwstestschool.com",
      role: "Teacher",
      status: "Inactive",
      schoolId: "SCH-002",
      school: "Second WWS Test School",
      joined: "Sep 3, 2026",
    },
    {
      id: "USR-007",
      name: "Daniel Musa",
      email: "admin@registrationtestschool.com",
      role: "Admin",
      status: "Active",
      schoolId: "SCH-003",
      school: "Registration Test School",
      joined: "Sep 5, 2026",
    },
  ];

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        user.name.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue) ||
        user.id.toLowerCase().includes(searchValue);

      const matchesRole =
        roleFilter === "all" ||
        user.role.toLowerCase() === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        user.status.toLowerCase() === statusFilter;

      const matchesSchool =
        schoolFilter === "all" ||
        user.schoolId === schoolFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus &&
        matchesSchool
      );
    });
  }, [search, roleFilter, statusFilter, schoolFilter]);

  const activeUsers = users.filter(
    (user) => user.status === "Active"
  ).length;

  const inactiveUsers = users.filter(
    (user) => user.status === "Inactive"
  ).length;

  const adminUsers = users.filter(
    (user) => user.role === "Admin"
  ).length;

  const teacherUsers = users.filter(
    (user) => user.role === "Teacher"
  ).length;

  const schoolIds = [...new Set(
    users.map((user) => user.schoolId)
  )];

  return (
    <div className="developer-users">
      <header className="developer-page-header">
        <div>
          <p className="developer-page-header__eyebrow">
            Platform
          </p>

          <h1>Users & Staff</h1>

          <p>
            View and monitor user accounts across all schools.
          </p>
        </div>
      </header>

      <section className="developer-stats">
        <article className="developer-stat-card">
          <span>Total Users</span>
          <strong>{users.length}</strong>
          <p>Registered platform users</p>
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
          <span>Administrators</span>
          <strong>{adminUsers}</strong>
          <p>School administrator accounts</p>
        </article>
      </section>

      <section className="developer-users-role-summary">
        <article className="developer-panel-card">
          <span>Teachers</span>
          <strong>{teacherUsers}</strong>
          <p>Registered teacher accounts</p>
        </article>

        <article className="developer-panel-card">
          <span>Accountants</span>
          <strong>
            {users.filter(
              (user) => user.role === "Accountant"
            ).length}
          </strong>
          <p>Registered accountant accounts</p>
        </article>

        <article className="developer-panel-card">
          <span>Exam Officers</span>
          <strong>
            {users.filter(
              (user) => user.role === "Exam Officer"
            ).length}
          </strong>
          <p>Registered exam officer accounts</p>
        </article>
      </section>

      <section className="developer-panel-card developer-users-panel">
        <div className="developer-panel-card__header">
          <div>
            <h2>Platform Users</h2>

            <p>
              All staff accounts currently registered across schools.
            </p>
          </div>
        </div>

        <div className="developer-users-toolbar">
          <div className="developer-users-search">
            <input
              type="search"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="developer-users-filter">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="accountant">Accountant</option>
              <option value="exam officer">
                Exam Officer
              </option>
            </select>
          </div>

          <div className="developer-users-filter">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="developer-users-filter">
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
            >
              <option value="all">All schools</option>

              {schoolIds.map((schoolId) => {
                const school = users.find(
                  (user) => user.schoolId === schoolId
                );

                return (
                  <option
                    value={schoolId}
                    key={schoolId}
                  >
                    {school.school}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="developer-table-wrapper">
          <table className="developer-table">
            <thead>
              <tr>
                <th>User</th>
                <th>User ID</th>
                <th>School</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="developer-platform-user">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                    </td>

                    <td>{user.id}</td>

                    <td>
                      <div className="developer-platform-school">
                        <strong>{user.school}</strong>
                        <span>{user.schoolId}</span>
                      </div>
                    </td>

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

                    <td>
                      <Link
                        to={`/platform/schools/${user.schoolId}/users`}
                        className="developer-table-action"
                      >
                        View School
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
                    No users match your filters.
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

export default DeveloperUsers;