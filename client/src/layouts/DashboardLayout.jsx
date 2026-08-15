import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header/Header'
import Sidebar from '../components/layout/Sidebar/Sidebar'
import "../components/layout/Layout.css";
import initialPayments from "../data/payments";
import initialStudents from "../data/students";
import initialParents from "../data/parents";


const DashboardLayout = () => {


     const [payments, setPayments] = useState(() => {
    const savedPayments = localStorage.getItem("payments");

    return savedPayments
      ? JSON.parse(savedPayments)
      : initialPayments;
  });


    const [students, setStudents] = useState(() => {
      const savedStudents = localStorage.getItem("students");

      return savedStudents
        ? JSON.parse(savedStudents)
        : initialStudents;
  });

    const [teachers, setTeachers] = useState(() => {
      const savedTeachers = localStorage.getItem("teachers");

      return savedTeachers
        ? JSON.parse(savedTeachers)
        : initialTeachers;
  });


  const [parents, setParents] = useState(() => {
     const savedParents = localStorage.getItem("parents");

      return savedParents
        ? JSON.parse(savedParents)
        : initialParents;
});

  return (
    <>
        <Header/>
           
        <div className="dashboard-layout">

            <Sidebar/>

            <main className='dashboard-content'>
                 <Outlet context={{
                      payments, 
                      setPayments, 
                      students, 
                      setStudents,
                      teachers,
                      setTeachers,
                      parents,
                      setParents
                   
                   }}
                   
                   />
            </main>
        </div>
        
    </>
  )
}

export default DashboardLayout