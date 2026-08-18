import React, {useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header/Header'
import Sidebar from '../components/layout/Sidebar/Sidebar'
import "../components/layout/Layout.css";
import initialPayments from "../data/payments";
import initialEnrollments from "../data/enrollments";
import initialStudents from "../data/students";
import initialParents from "../data/parents";
import initialClasses from "../data/classes";
import initialTeachers from "../data/teachers";
import initialSections from "../data/sections";
import initialAttendance from "../data/attendance";
import initialActiveAcademicLevels from "../data/activeAcademicLevels";



const DashboardLayout = () => {


     const [payments, setPayments] = useState(() => {
    const savedPayments = localStorage.getItem("payments");

    return savedPayments
      ? JSON.parse(savedPayments)
      : initialPayments;
  });

  const [enrollments, setEnrollments] = useState(() => {
      const savedEnrollments = localStorage.getItem("enrollments");

      return savedEnrollments
        ? JSON.parse(savedEnrollments)
        : initialEnrollments;
});


    useEffect(() => {
    localStorage.setItem("enrollments", JSON.stringify(enrollments));
}, [enrollments]);


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


  const [classes, setClasses] = useState(() => {
      const savedClasses = localStorage.getItem("classes");

    return savedClasses
      ? JSON.parse(savedClasses)
      : initialClasses;
});


    const [sections, setSections] = useState(() => {
       const savedSections = localStorage.getItem("sections");

    return savedSections
      ? JSON.parse(savedSections)
      : initialSections;
});


    useEffect(() => {
        localStorage.setItem("sections", JSON.stringify(sections));
    }, [sections]);


      const [activeAcademicLevels, setActiveAcademicLevels] = useState(() => {
    const savedActiveAcademicLevels =
        localStorage.getItem("activeAcademicLevels");

    return savedActiveAcademicLevels
        ? JSON.parse(savedActiveAcademicLevels)
        : initialActiveAcademicLevels;
});


    useEffect(() => {
       localStorage.setItem(
        "activeAcademicLevels",
        JSON.stringify(activeAcademicLevels)
    );
}, [activeAcademicLevels]);


const [attendance, setAttendance] = useState(() => {
    const savedAttendance = localStorage.getItem("attendance");

    return savedAttendance
      ? JSON.parse(savedAttendance)
      : initialAttendance;
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
                      enrollments,
                      setEnrollments,
                      students, 
                      setStudents,
                      teachers,
                      setTeachers,
                      parents,
                      setParents,
                      classes,
                      setClasses,
                      sections,
                      setSections,
                      activeAcademicLevels,
                      setActiveAcademicLevels,
                      attendance,
                      setAttendance
                   
                   }}
                   
                   />
            </main>
        </div>
        
    </>
  )
}

export default DashboardLayout