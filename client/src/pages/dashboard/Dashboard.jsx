import React from 'react'
import dashboardStats from '../../data/dashboardStats'
import StatCard from '../../components/dashboard/StatCard/StatCard'
import currentUser from '../../data/currentUser'
import recentActivities from '../../data/recentActivity'
import ActivityItem from '../../components/dashboard/ActivityItem/ActivityItem'
import upcomingEvents from '../../data/upcomingEvents'
import EventItem from '../../components/dashboard/EventItem/EventItem'
import quickActions from '../../data/quickActions'
import ActionButton from '../../components/dashboard/ActionButton/ActionButton'
import "./Dashboard.css"
const Dashboard = () => {
  return (
      <div className="dashboard">
         <h1>Dashboard</h1>

         <div className="dashboard__welcome">
            <h1>
                Good Evening, {currentUser.role} {currentUser.lastName} 👋
            </h1>
            <p>Welcome back to WWS Edusuite.</p>
         </div>

         <div className="dashboard__stats">
              <StatCard
                  title="Students"
                  value={dashboardStats.students}
              />
              
              <StatCard
                  title="Teacherss"
                  value={dashboardStats.teachers}
              />
              <StatCard
                  title="Parents"
                  value={dashboardStats.parents}
              />
              <StatCard
                  title="Classrooms"
                  value={dashboardStats.classrooms}
              />
              <StatCard
                  title="Attendance Today"
                  value={dashboardStats.attendanceToday}
              />
              <StatCard
                  title="Staff"
                  value={dashboardStats.staff}
              />
         </div>
          <div className="dashboard__info">
              <section className="dashboard__activities">
                    <h2>Recent Activities</h2>
                    
                    {recentActivities.map((item) => (
                      <ActivityItem
                          key={item.id}
                          activity={item.activity}
                          time={item.time}
                      />
                    ) )}
              </section>


              <section className="dashboard__events">
                    <h2>Upcoming Events</h2>

                    {upcomingEvents.map((event) => (
                        <EventItem
                          key={event.id}
                          title={event.title}
                          date={event.date}
                        />
                    ))}
              </section>

              <section className="quick-actions">
                <h2>Quick Actions</h2>

                <div className="quick-actions__grid">
                {quickActions.map((action) => (
                  <ActionButton
                    key={action.id}
                    label={action.label}
                    path={action.path}
                    icon={action.icon}
                  />
                ) )}
                </div>
              </section>
         </div>
        
      </div>
  )
}

export default Dashboard