import React from 'react'
import dashboardStats from '../../data/dashboardStats'
import StatCard from '../../components/dashboard/StatCard/StatCard'
import "./Dashboard.css"
const Dashboard = () => {
  return (
      <div className="dashboard">
         <h1>Dashboard</h1>

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
        
      </div>
  )
}

export default Dashboard