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
import initialAcademicSessions from "../data/academicSessions";
import initialAcademicTerms from "../data/academicTerms";
import initialAcademicLevels from "../data/academicLevels";
import initialRecentActivities from "../data/recentActivity";
import initialUpcomingEvents from "../data/upcomingEvents";
import initialSubjects from "../data/subjects";
import initialResults from "../data/results";


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


const [academicSessions, setAcademicSessions] = useState(() => {
    const savedAcademicSessions =
        localStorage.getItem("academicSessions");

    return savedAcademicSessions
        ? JSON.parse(savedAcademicSessions)
        : initialAcademicSessions;
});


useEffect(() => {
    localStorage.setItem(
        "academicSessions",
        JSON.stringify(academicSessions)
    );
}, [academicSessions]);



const [academicTerms, setAcademicTerms] = useState(() => {
    const savedAcademicTerms =
        localStorage.getItem("academicTerms");

    return savedAcademicTerms
        ? JSON.parse(savedAcademicTerms)
        : initialAcademicTerms;
});

useEffect(() => {
    localStorage.setItem(
        "academicTerms",
        JSON.stringify(academicTerms)
    );
}, [academicTerms]);


const [academicLevels, setAcademicLevels] = useState(() => {
    const savedAcademicLevels =
        localStorage.getItem("academicLevels");

    return savedAcademicLevels
        ? JSON.parse(savedAcademicLevels)
        : initialAcademicLevels;
});


useEffect(() => {
    localStorage.setItem(
        "academicLevels",
        JSON.stringify(academicLevels)
    );
}, [academicLevels]);



const [subjects, setSubjects] = useState(() => {
  const savedSubjects = localStorage.getItem("subjects");

  return savedSubjects
    ? JSON.parse(savedSubjects)
    : initialSubjects;
});


useEffect(() => {
  localStorage.setItem("subjects", JSON.stringify(subjects));
}, [subjects]);



const [results, setResults] = useState(() => {
  const savedResults = localStorage.getItem("results");

  return savedResults
    ? JSON.parse(savedResults)
    : initialResults;
});

useEffect(() => {
  localStorage.setItem("results", JSON.stringify(results));
}, [results]);


const [attendance, setAttendance] = useState(() => {
        const savedAttendance = localStorage.getItem("attendance");

        return savedAttendance
        ? JSON.parse(savedAttendance)
        : initialAttendance;
    });


    useEffect(() => {
    localStorage.setItem(
        "attendance",
        JSON.stringify(attendance)
    );
    }, [attendance]);


/* Recent activity and persistence */

     const [recentActivities, setRecentActivities] = useState(() => {
        const savedActivities = localStorage.getItem("recentActivities");

        if (!savedActivities) {
            return initialRecentActivities;
        }

        try {
            return JSON.parse(savedActivities);
        } catch (error) {
            console.error("Failed to load recent activities:", error);

            localStorage.removeItem("recentActivities");

            return initialRecentActivities;
        }
    });

    /* Persist recent activities to localStorage whenever it changes */
    useEffect(() => {
        localStorage.setItem("recentActivities", JSON.stringify(recentActivities));

        }, [recentActivities]);

  const [parents, setParents] = useState(() => {
     const savedParents = localStorage.getItem("parents");

      return savedParents
        ? JSON.parse(savedParents)
        : initialParents;
});



/* Upcoming events and persistence */

const [upcomingEvents, setUpcomingEvents] = useState(() => {
    const savedEvents = localStorage.getItem("upcomingEvents");

    if (!savedEvents) {
        return initialUpcomingEvents;
    }

    try {
        return JSON.parse(savedEvents);
    } catch (error) {
        console.error("Failed to load upcoming events:", error);

        localStorage.removeItem("upcomingEvents");

        return initialUpcomingEvents;
    }
});

useEffect(() => {
    localStorage.setItem(
        "upcomingEvents",
        JSON.stringify(upcomingEvents)
    );
}, [upcomingEvents]);


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
                       academicSessions,
                      setAcademicSessions,
                      academicTerms,
                      setAcademicTerms,
                      academicLevels,
                      setAcademicLevels,
                      attendance,
                      setAttendance,
                      recentActivities,
                      setRecentActivities,
                      upcomingEvents,
                      setUpcomingEvents,
                      subjects,
                      setSubjects,
                      results,
                      setResults,
                   }}
                   
                   />
            </main>
        </div>
        
    </>
  )
}

export default DashboardLayout