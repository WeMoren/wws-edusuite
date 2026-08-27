import React, { useState }  from 'react';
import { useOutletContext } from 'react-router-dom';
import StatCard from '../../components/dashboard/StatCard/StatCard';
import currentUser from '../../data/currentUser';
import ActivityItem from '../../components/dashboard/ActivityItem/ActivityItem';
import EventItem from '../../components/dashboard/EventItem/EventItem';
import quickActions from '../../data/quickActions';
import ActionButton from '../../components/dashboard/ActionButton/ActionButton';
import "./Dashboard.css";
import EventModal from '../../components/dashboard/EventModal/EventModal';



const getRelativeTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const differenceInSeconds = Math.floor((now - created) / 1000);

    if(differenceInSeconds < 60){
        return "Just now"
    }
            //  {} < $
    const differenceInMinutes = Math.floor(differenceInSeconds / 60);

    if(differenceInMinutes < 60){
        return `${differenceInMinutes}  ${
            differenceInMinutes === 1 ? "minute" : "minutes"} ago`
    }

    const differenceInHours = Math.floor(differenceInMinutes / 60);

    if(differenceInHours < 24){
        return `${differenceInHours} ${
            differenceInHours === 1 ? "hour" : "hours"
        } ago`
    }


    const differenceInDays = Math.floor(differenceInHours / 24);

    if(differenceInDays === 1){
        return "Yesterday"
    }

    return `${differenceInDays} days ago`;
}




const Dashboard = () => {


    const { 
            students, 
            teachers, 
            parents, 
            classes, 
            attendance,
            recentActivities,
            upcomingEvents,
            setUpcomingEvents
        } = useOutletContext();

            const today = new Date().toISOString().split("T")[0];

            const todayAttendance = attendance.filter((record) => record.date === today);

            const attendancePercentage = students.length > 0 ? Math.round(
                (todayAttendance.filter((record) => record.status === "present").length / students.length) * 100
            ) : 0;


            const [showEventModal, setShowEventModal] = useState(false);


            const upcomingEventPreview = [...upcomingEvents]
                .filter((event) => new Date(event.date)  >= new Date())
                .sort((a, b)  => new Date(a.date) - new Date(b.date))
                .slice(0, 4);

                const recentActivityPreview = recentActivities.slice(0, 5);


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
                  value={students.length}
                  
              />
              
              <StatCard
                  title="Teachers"
                  value={teachers.length}
              />
              <StatCard
                  title="Parents"
                  value={parents.length}
              />
              <StatCard
                  title="Classes"
                  value={classes.length}
              />
              <StatCard
                  title="Attendance Today"
                  value={`${attendancePercentage}%`}
              />
              <StatCard
                  title="Staff"
                  value="---"
              />
         </div>
          <div className="dashboard__info">
              <section className="dashboard__activities">
                    <h2>Recent Activities</h2>
                    
                    {recentActivityPreview.map((item) => (
                      <ActivityItem
                          key={item.id}
                          activity={item.activity}
                          time={getRelativeTime(item.createdAt)}
                      />
                    ) )}
              </section>


              <section className="dashboard__events">
                   <div className="dashboard__section-header">
                     <h2>Upcoming Events</h2>

                        <button
                            type='button'
                            onClick={()=> setShowEventModal(true)}
                        >
                            + Add Event
                        </button>
                   </div>

                   

                {upcomingEventPreview.map((event) => (
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
        

            {showEventModal && (
    <EventModal
        onClose={() => setShowEventModal(false)}
        onAddEvent={(eventData) => {
            setUpcomingEvents((prevEvents) => [
                ...prevEvents,
                {
                    ...eventData,
                    id:
                        prevEvents.length > 0
                            ? Math.max(
                                ...prevEvents.map((event) => event.id)
                            ) + 1
                            : 1,
                },
            ]);

            setShowEventModal(false);
        }}
    />
)}

      </div>
  )
}

export default Dashboard