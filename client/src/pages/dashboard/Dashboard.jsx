
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  GraduationCap,
  Users,
  UsersRound,
  School,
  ClipboardCheck,
  BriefcaseBusiness,
} from "lucide-react";
import StatCard from "../../components/dashboard/StatCard/StatCard";
import ActivityItem from "../../components/dashboard/ActivityItem/ActivityItem";
import EventItem from "../../components/dashboard/EventItem/EventItem";
import quickActions from "../../data/quickActions";
import ActionButton from "../../components/dashboard/ActionButton/ActionButton";
import EventModal from "../../components/dashboard/EventModal/EventModal";
import { useAuth } from "../../auth/AuthContext";
import "./Dashboard.css";

const getRelativeTime = (createdAt) => {
  const now = new Date();
  const created = new Date(createdAt);
  const differenceInSeconds = Math.floor((now - created) / 1000);

  if (differenceInSeconds < 60) {
    return "Just now";
  }

  const differenceInMinutes = Math.floor(differenceInSeconds / 60);

  if (differenceInMinutes < 60) {
    return `${differenceInMinutes} ${
      differenceInMinutes === 1 ? "minute" : "minutes"
    } ago`;
  }

  const differenceInHours = Math.floor(differenceInMinutes / 60);

  if (differenceInHours < 24) {
    return `${differenceInHours} ${
      differenceInHours === 1 ? "hour" : "hours"
    } ago`;
  }

  const differenceInDays = Math.floor(differenceInHours / 24);

  if (differenceInDays === 1) {
    return "Yesterday";
  }

  return `${differenceInDays} days ago`;
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
};

const Dashboard = () => {
  const { currentUser } = useAuth();

  const {
    students,
    teachers,
    staffCount,
    parents,
    classes,
    attendance,
    recentActivities,
    upcomingEvents,
    createEvent,
  } = useOutletContext();

  const today = new Date().toISOString().split("T")[0];

  const todayAttendance = attendance.filter(
    (record) => record.date === today
  );

  const attendancePercentage =
    students.length > 0
      ? Math.round(
          (todayAttendance.filter(
            (record) => record.status === "present"
          ).length /
            students.length) *
            100
        )
      : 0;

  const [showEventModal, setShowEventModal] = useState(false);

  const upcomingEventPreview = [...upcomingEvents]
    .filter((event) => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  const recentActivityPreview = recentActivities.slice(0, 5);

  const firstName = currentUser?.firstName || "there";

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__heading">
          <span className="dashboard__eyebrow">SCHOOL OVERVIEW</span>
          <h1>
            {getGreeting()}, {firstName}
            {currentUser?.lastName ? ` ${currentUser.lastName}` : ""}!
          </h1>
          <p>
            Here's what's happening across your school today.
          </p>
        </div>
      </header>

      <section className="dashboard__stats" aria-label="School statistics">
        <StatCard
          title="Students"
          value={students.length}
          icon={GraduationCap}
        />

        <StatCard
          title="Teachers"
          value={teachers.length}
          icon={Users}
        />

        <StatCard
          title="Parents"
          value={parents.length}
          icon={UsersRound}
        />

        <StatCard
          title="Classes"
          value={classes.length}
          icon={School}
        />

        <StatCard
          title="Attendance Today"
          value={`${attendancePercentage}%`}
          icon={ClipboardCheck}
        />

        <StatCard
          title="Management Staff"
          value={staffCount}
          icon={BriefcaseBusiness}
        />
      </section>

      <div className="dashboard__info">
        <section className="dashboard__panel dashboard__activities">
          <div className="dashboard__panel-heading">
            <div>
              <h2>Recent Activities</h2>
              <p>A quick look at recent school updates</p>
            </div>
          </div>

          {recentActivityPreview.length > 0 ? (
            <div className="dashboard__activity-list">
              {recentActivityPreview.map((item) => (
                <ActivityItem
                  key={item.id}
                  activity={item.activity}
                  time={getRelativeTime(item.createdAt)}
                />
              ))}
            </div>
          ) : (
            <div className="dashboard__empty-state">
              <p>No recent activities yet.</p>
              <span>School updates will appear here as they happen.</span>
            </div>
          )}
        </section>

        <section className="dashboard__panel dashboard__events">
          <div className="dashboard__panel-heading dashboard__section-header">
            <div>
              <h2>Upcoming Events</h2>
              <p>Keep track of important school dates</p>
            </div>

            <button
              type="button"
              onClick={() => setShowEventModal(true)}
            >
              + Add Event
            </button>
          </div>

          {upcomingEventPreview.length > 0 ? (
            <div className="dashboard__event-list">
              {upcomingEventPreview.map((event) => (
                <EventItem
                  key={event.id}
                  title={event.title}
                  date={event.date}
                />
              ))}
            </div>
          ) : (
            <div className="dashboard__empty-state">
              <p>No upcoming events.</p>
              <span>Add an event to keep important dates visible.</span>
            </div>
          )}
        </section>
      </div>

      <section className="dashboard__panel quick-actions">
        <div className="dashboard__panel-heading">
          <div>
            <h2>Quick Actions</h2>
            <p>Jump straight into common school tasks</p>
          </div>
        </div>

        <div className="quick-actions__grid">
          {quickActions.map((action) => (
            <ActionButton
              key={action.id}
              label={action.label}
              path={action.path}
              icon={action.icon}
            />
          ))}
        </div>
      </section>

      {showEventModal && (
        <EventModal
          onClose={() => setShowEventModal(false)}
          onAddEvent={createEvent}
        />
      )}
    </div>
  );
};

export default Dashboard;
