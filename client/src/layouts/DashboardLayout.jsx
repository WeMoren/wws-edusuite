import React, {useEffect, useState } from 'react'
import {Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from "../auth/AuthContext";
import { hasPermission } from "../auth/permissions";
import Header from '../components/layout/Header/Header'
import Sidebar from '../components/layout/Sidebar/Sidebar'
import "../components/layout/Layout.css";
import initialActiveAcademicLevels from "../data/activeAcademicLevels";
import initialResults from "../data/results";


const DashboardLayout = () => {
    const location = useLocation();

    const {
        authToken,
        currentUser,
        subscriptionAccess,
        subscriptionAccessLoading,
        subscriptionAccessError,
        refreshSubscriptionAccess,
    } = useAuth();

    const isSubscriptionExemptRoute = [
        "/dashboard/settings",
        "/dashboard/subscription",
        "/dashboard/subscription/callback",
    ].includes(location.pathname);

    const canLoadOperationalData =
        Boolean(authToken) &&
        !subscriptionAccessLoading &&
        subscriptionAccess?.allowed === true;

const userRoles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : [currentUser?.role];

const canViewFinancialAccounts = userRoles.some((role) =>
    hasPermission(role, "accountant", "view")
);

const canViewStudentPaymentStatus = userRoles.some((role) =>
    hasPermission(role, "students", "view")
);
    const API_BASE_URL = "http://localhost:5000/api";
    const [academicDataRefreshKey, setAcademicDataRefreshKey] = useState(0);


   const [payments, setPayments] = useState([]);

   const [financialAccounts, setFinancialAccounts] = useState([]);
  const [financialAccountsLoading, setFinancialAccountsLoading] = useState(false);
  const [financialAccountsError, setFinancialAccountsError] = useState("");

  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");

    const [teachers, setTeachers] = useState([]);


    const [staffCount, setStaffCount] = useState(0);

useEffect(() => {
   if (!canLoadOperationalData) {
        setStaffCount(0);
        return;
    }

    const controller = new AbortController();

    const loadStaffCount = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/staff/count`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                signal: controller.signal,
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Failed to load staff count.");
            }

            setStaffCount(Number(data.count) || 0);
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Failed to load dashboard staff count:", error);
                setStaffCount(0);
            }
        }
    };

    loadStaffCount();

    return () => controller.abort();
}, [authToken, canLoadOperationalData]);


    useEffect(() => {
    if (!canLoadOperationalData) {
        setTeachers([]);
        return;
    }

    const controller = new AbortController();

    const loadTeachers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/teachers`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                signal: controller.signal,
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || "Failed to load teachers.");
            }

            setTeachers(
                (Array.isArray(data.teachers) ? data.teachers : []).map(
                    (teacher) => ({
                        id: teacher.id,
                       schoolStaffId: teacher.school_staff_id,
                        staffId: teacher.staff_id,
                        firstName: teacher.first_name,
                        lastName: teacher.last_name,
                        email: teacher.email,
                        phoneNum: teacher.phone || "",
                        subject: teacher.subject,
                        gender: teacher.gender,
                        status: teacher.status,
                    })
                )
            );
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Failed to load dashboard teachers:", error);
                setTeachers([]);
            }
        }
    };

    loadTeachers();

    return () => controller.abort();
}, [authToken, canLoadOperationalData]);


    const [classes, setClasses] = useState([]);


    const [sections, setSections] = useState([]);




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

const [academicSessions, setAcademicSessions] = useState([]);
const [academicTerms, setAcademicTerms] = useState([]);
const [academicLevels, setAcademicLevels] = useState([]);

const [dashboardData, setDashboardData] = useState({
  students: [],
  teachers: [],
  classes: [],
  sections: [],
  parents: [],
  attendance: [],
  enrollments: [],
  staff: [],
});

const [academicSetupLoading, setAcademicSetupLoading] = useState(false);
const [academicSetupError, setAcademicSetupError] = useState("");


useEffect(() => {
  if (!canLoadOperationalData) {
    setAcademicSessions([]);
    setAcademicTerms([]);
    setAcademicLevels([]);
    setAcademicSetupError("");
    return;
  }

  const controller = new AbortController();

  const loadAcademicSetup = async () => {
    setAcademicSetupLoading(true);
    setAcademicSetupError("");

    try {
      const endpoints = [
        "/academic-levels",
        "/academic-sessions",
        "/terms",
        "/classes",
        "/sections",
      ];

      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
            signal: controller.signal,
          })
        )
      );

      const results = await Promise.all(
        responses.map(async (response) => {
          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              data.message || "Failed to load academic setup."
            );
          }

          return data;
        })
      );

      const [levelsData, sessionsData, termsData, classesData, sectionsData] = results;

      setAcademicLevels(
        (levelsData.levels || []).map((level) => ({
          id: level.id,
          name: level.name,
          category: level.category,
          displayOrder: level.display_order,
        }))
      );

      setAcademicSessions(
        (sessionsData.sessions || []).map((session) => ({
          id: session.id,
          name: session.name,
          startDate: session.start_date,
          endDate: session.end_date,
          isCurrent: session.is_current,
        }))
      );

      setAcademicTerms(
        (termsData.terms || []).map((term) => ({
          id: term.id,
          academicSessionId: term.academic_session_id,
          academicSessionName: term.academic_session_name,
          name: term.name,
          displayOrder: term.display_order,
          startDate: term.start_date,
          endDate: term.end_date,
          isCurrent: term.is_current,
        }))
      );
      setClasses(
        (classesData.classes || []).map((schoolClass) => ({
          id: schoolClass.id,
          academicSessionId: schoolClass.academic_session_id,
          academicLevelId: schoolClass.academic_level_id,
          name: schoolClass.name,
        }))
      );

      setSections(
        (sectionsData.sections || []).map((section) => ({
            id: section.id,
            classId: section.class_id,
            name: section.name,
            classTeacherId: section.class_teacher_id || "",
            room: section.room || "",
            capacity: section.capacity ?? "",
        }))
    );

    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Failed to load academic setup:", error);
        setAcademicSetupError(error.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setAcademicSetupLoading(false);
      }
    }
  };

  loadAcademicSetup();

  return () => controller.abort();
}, [authToken, canLoadOperationalData, academicDataRefreshKey]);

useEffect(() => {
  if (!canLoadOperationalData) {
    setStudents([]);
    setEnrollments([]);
    setStudentsError("");
    setStudentsLoading(false);
    return;
  }

  const controller = new AbortController();

  async function loadStudentsAndEnrollments() {
    setStudentsLoading(true);
    setStudentsError("");

    try {
      const endpoints = ["/students", "/enrollments"];

      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          fetch(API_BASE_URL + endpoint, {
            headers: {
              Authorization: "Bearer " + authToken,
            },
            signal: controller.signal,
          })
        )
      );

      const results = await Promise.all(
        responses.map(async (response) => {
          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              data.message || "Failed to load students and enrollments."
            );
          }

          return data;
        })
      );

      const studentsData = results[0];
      const enrollmentsData = results[1];

      const mappedStudents = (studentsData.students || []).map((student) => ({
        id: student.id,
        schoolId: student.school_id,
        admissionNo: student.admission_no,
        firstName: student.first_name,
        middleName: student.middle_name,
        lastName: student.last_name,
        gender: student.gender,
        dateOfBirth: student.date_of_birth,
        phone: student.phone,
        email: student.email,
        address: student.address,
        status: student.status,
        createdAt: student.created_at,
        updatedAt: student.updated_at,
      }));

      const mappedEnrollments = (enrollmentsData.enrollments || []).map(
        (enrollment) => ({
          id: enrollment.id,
          schoolId: enrollment.school_id,
          studentId: enrollment.student_id,
          academicSessionId: enrollment.academic_session_id,
          classId: enrollment.class_id,
          sectionId: enrollment.section_id,
          streamId: enrollment.stream_id,
          combinationId: enrollment.subject_combination_id,
          subjectCombinationId: enrollment.subject_combination_id,
          status: enrollment.status,
          enrolledAt: enrollment.enrolled_at,
          admissionNo: enrollment.admission_no,
          firstName: enrollment.first_name,
          middleName: enrollment.middle_name,
          lastName: enrollment.last_name,
          academicSessionName: enrollment.academic_session_name,
          className: enrollment.class_name,
          sectionName: enrollment.section_name,
          streamName: enrollment.stream_name,
          combinationName: enrollment.subject_combination_name,
          academicLevelId: enrollment.academic_level_id,
        })
      );

      if (!controller.signal.aborted) {
        setStudents(mappedStudents);
        setEnrollments(mappedEnrollments);
      }
    } catch (error) {
      if (error.name !== "AbortError" && !controller.signal.aborted) {
        console.error("Failed to load students and enrollments:", error);
        setStudents([]);
        setEnrollments([]);
        setStudentsError(error.message || "Failed to load students.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setStudentsLoading(false);
      }
    }
  }

  loadStudentsAndEnrollments();

  return () => controller.abort();
}, [authToken, canLoadOperationalData, academicDataRefreshKey]);

useEffect(() => {
  if (!canLoadOperationalData || !canViewFinancialAccounts) {
    setPayments([]);
    return;
  }

  const controller = new AbortController();

  const loadPayments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to load payments.");
      }

      const mappedPayments = (data.payments || []).map((payment) => ({
        id: payment.id,
        schoolId: payment.school_id,
        studentId: payment.student_id,
        financialAccountId: payment.financial_account_id,
        enrollmentId: payment.enrollment_id,
        amount: Number(payment.amount),
        date: payment.payment_date,
        paymentMethod: payment.payment_method,
        reference: payment.reference,
        description: payment.description,
        studentName: [
          payment.first_name,
          payment.middle_name,
          payment.last_name,
        ]
          .filter((name) => typeof name === "string" && name.trim() !== "")
          .map((name) => name.trim())
          .join(" "),
        admissionNo: payment.admission_no,
        academicSessionName: payment.academic_session_name,
        termName: payment.term_name,
        className: payment.class_name,
      }));

      if (!controller.signal.aborted) {
        setPayments(mappedPayments);
      }
    } catch (error) {
      if (error.name !== "AbortError" && !controller.signal.aborted) {
        console.error("Failed to load payments:", error);
        setPayments([]);
      }
    }
  };

  loadPayments();

  return () => controller.abort();
}, [authToken, canLoadOperationalData, canViewFinancialAccounts]);



useEffect(() => {
  if (!canLoadOperationalData || (!canViewFinancialAccounts && !canViewStudentPaymentStatus)) {
    setFinancialAccounts([]);
    setFinancialAccountsError("");
    setFinancialAccountsLoading(false);
    return;
  }

  const controller = new AbortController();

  const accountEndpoint = canViewFinancialAccounts
    ? "/student-financial-accounts"
    : "/student-financial-accounts/payment-statuses";

  const loadFinancialAccounts = async () => {
    setFinancialAccountsLoading(true);
    setFinancialAccountsError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}${accountEndpoint}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          signal: controller.signal,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load student financial accounts."
        );
      }

      let mappedAccounts = [];

      if (canViewFinancialAccounts) {
        mappedAccounts = (data.financialAccounts || []).map((account) => ({
          id: account.id,
          studentId: account.student_id,
          enrollmentId: account.enrollment_id,
          academicSessionId: account.academic_session_id,
          academicSessionName: account.academic_session_name,
          termId: account.term_id,
          termName: account.term_name,
          feeStructureId: account.fee_structure_id,
          feeStructureName: account.fee_structure_name,
          className: account.class_name,
          academicLevelName: account.academic_level_name,
          totalDue: Number(account.total_due),
          totalPaid: Number(account.total_paid),
          status: account.status,
          outstanding: Math.max(
            Number(account.total_due) - Number(account.total_paid),
            0
          ),
        }));
      } else {
        mappedAccounts = (data.paymentStatuses || []).map((account) => ({
          studentId: account.student_id,
          enrollmentId: account.enrollment_id,
          termId: account.term_id,
          status: account.status,
        }));
      }

      if (!controller.signal.aborted) {
        setFinancialAccounts(mappedAccounts);
      }
    } catch (error) {
      if (error.name !== "AbortError" && !controller.signal.aborted) {
        console.error("Failed to load financial accounts:", error);
        setFinancialAccounts([]);
        setFinancialAccountsError(
          error.message || "Failed to load student financial accounts."
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setFinancialAccountsLoading(false);
      }
    }
  };

  loadFinancialAccounts();

  return () => controller.abort();
}, [
  authToken,
  canLoadOperationalData,
  canViewFinancialAccounts,
  canViewStudentPaymentStatus,
  academicDataRefreshKey,
]);



const [subjects, setSubjects] = useState([]);

useEffect(() => {
    if (!canLoadOperationalData) {
        setSubjects([]);
        return;
    }

    const controller = new AbortController();

    const loadSubjects = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/subjects`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                signal: controller.signal,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load subjects."
                );
            }

            setSubjects(
                (data.subjects || []).map((subject) => ({
                    id: subject.id,
                    name: subject.name,
                    code: subject.code,
                    category: subject.category,
                    isCore: subject.is_core,
                    academicLevelIds: (subject.academic_levels || []).map(
                        (level) => level.id
                    ),
                }))
            );
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Failed to load subjects:", error);
            }
        }
    };

    loadSubjects();

    return () => controller.abort();
}, [authToken, canLoadOperationalData]);



const [streams, setStreams] = useState([]);
const [streamLevels, setStreamLevels] = useState([]);
const [subjectCombinations, setSubjectCombinations] = useState([]);

useEffect(() => {
  if (!canLoadOperationalData) {
    setStreams([]);
    setStreamLevels([]);
    setSubjectCombinations([]);
    return;
  }

  const controller = new AbortController();

  const loadStreams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/streams`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to load streams.");
      }

      const mappedStreams = (data.streams || []).map((stream) => {
        const academicLevels = (stream.academic_levels || []).map((level) => ({
          id: level.id,
          name: level.name,
          category: level.category,
          displayOrder: level.displayOrder,
          isActive: level.isActive,
        }));

        return {
          id: stream.id,
          name: stream.name,
          code: stream.code,
          description: stream.description ?? "",
          isActive: stream.is_active,
          academicLevels,
          academicLevelIds: academicLevels.map((level) => level.id),
        };
      });

      if (controller.signal.aborted) return;

      setStreams(mappedStreams);
      setStreamLevels(
        mappedStreams.flatMap((stream) =>
          stream.academicLevels.map((level) => ({
            id: `${stream.id}:${level.id}`,
            academicLevelId: level.id,
            streamId: stream.id,
            isActive: level.isActive,
          }))
        )
      );
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Failed to load streams:", error);
        // Preserve the last successfully loaded data on request failure.
      }
    }
  };

  const loadSubjectCombinations = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/subject-combinations`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          signal: controller.signal,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load subject combinations."
        );
      }

      const mappedCombinations = (data.subjectCombinations || []).map(
        (combination) => {
          const subjects = (combination.subjects || []).map((subject) => ({
            id: subject.id,
            name: subject.name,
            code: subject.code,
            category: subject.category,
            isCore: subject.isCore,
          }));

          return {
            id: combination.id,
            academicLevelId: combination.academic_level_id,
            streamId: combination.stream_id,
            name: combination.name,
            code: combination.code,
            isActive: combination.is_active,
            academicLevelName: combination.academic_level_name,
            academicLevelCategory: combination.academic_level_category,
            streamName: combination.stream_name,
            streamCode: combination.stream_code,
            subjects,
            subjectIds: subjects.map((subject) => subject.id),
          };
        }
      );

      if (!controller.signal.aborted) {
        setSubjectCombinations(mappedCombinations);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Failed to load subject combinations:", error);
        // Preserve the last successfully loaded data on request failure.
      }
    }
  };

  setStreams([]);
  setStreamLevels([]);
  setSubjectCombinations([]);

  loadStreams();
  loadSubjectCombinations();

  return () => controller.abort();
}, [authToken, canLoadOperationalData]);


const [results, setResults] = useState(() => {
  const savedResults = localStorage.getItem("results");

  return savedResults
    ? JSON.parse(savedResults)
    : initialResults;
});

useEffect(() => {
  localStorage.setItem("results", JSON.stringify(results));
}, [results]);


const [attendance, setAttendance] = useState([]);

useEffect(() => {
  if (!canLoadOperationalData) {
    setAttendance([]);
    return;
  }

  const controller = new AbortController();

  const loadAttendance = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load attendance records."
        );
      }

      if (!controller.signal.aborted) {
        setAttendance(
          (data.attendance || []).map((record) => ({
            id: record.id,
            schoolId: record.school_id,
            enrollmentId: record.enrollment_id,
            studentId: record.student_id,
            academicSessionId: record.academic_session_id,
            academicTermId: record.academic_term_id,
            classId: record.class_id,
            sectionId: record.section_id,
            date: record.attendance_date,
            status: record.status,
          }))
        );
      }
    } catch (error) {
      if (
        error.name !== "AbortError" &&
        !controller.signal.aborted
      ) {
        console.error("Failed to load attendance:", error);
      }
    }
  };

  loadAttendance();

  return () => controller.abort();
}, [authToken]);


        /* Recent activities from backend */

const [recentActivities, setRecentActivities] = useState([]);

const refreshRecentActivities = async (signal) => {
    if (!canLoadOperationalData) {
        setRecentActivities([]);
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/recent-activities`,
            {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                signal,
            }
        );

        const data = await response.json().catch(() => []);

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to load recent activities."
            );
        }

        setRecentActivities(
            Array.isArray(data) ? data : []
        );
    } catch (error) {
        if (error.name !== "AbortError") {
            console.error(
                "Failed to load recent activities:",
                error
            );

            setRecentActivities([]);
        }
    }
};

useEffect(() => {
    const controller = new AbortController();

    refreshRecentActivities(controller.signal);

    return () => controller.abort();
}, [authToken, canLoadOperationalData]);


        const [parents, setParents] = useState([]);
              useEffect(() => {
          if (!canLoadOperationalData) {
              setParents([]);
              return;
          }

          const controller = new AbortController();

           const loadParents = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/parents`, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                    signal: controller.signal,
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.message || "Failed to load parents.");
                }

                setParents(
                    Array.isArray(data.parents) ? data.parents : []
                );
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Failed to load dashboard parents:", error);
                    setParents([]);
        
                  }
      }
    };

    loadParents();

    return () => controller.abort();
}, [authToken, canLoadOperationalData]);


    /* Upcoming events from backend */
const [upcomingEvents, setUpcomingEvents] = useState([]);

useEffect(() => {
    if (!canLoadOperationalData) {
        setUpcomingEvents([]);
        return;
    }

    const controller = new AbortController();

    const loadUpcomingEvents = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/events`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
                signal: controller.signal,
            });

            const data = await response.json().catch(() => []);

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load upcoming events."
                );
            }

            setUpcomingEvents(
                Array.isArray(data) ? data : []
            );
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error(
                    "Failed to load upcoming events:",
                    error
                );

                setUpcomingEvents([]);
            }
        }
    };

    loadUpcomingEvents();

    return () => controller.abort();
}, [authToken, canLoadOperationalData]);


  
/* Upcoming Events backend operations */

const createEvent = async (eventData) => {
    const response = await fetch(`${API_BASE_URL}/events`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(eventData),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Failed to create event.");
    }

    if (!data.event) {
        throw new Error("The server did not return the created event.");
    }

    setUpcomingEvents((previousEvents) => [
        ...previousEvents,
        data.event,
    ]);

    return data.event;
};

const updateEvent = async (eventId, eventData) => {
    const response = await fetch(
        `${API_BASE_URL}/events/${eventId}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(eventData),
        }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Failed to update event.");
    }

    if (!data.event) {
        throw new Error("The server did not return the updated event.");
    }

    setUpcomingEvents((previousEvents) =>
        previousEvents.map((event) =>
            event.id === eventId ? data.event : event
        )
    );

    return data.event;
};

const deleteEvent = async (eventId) => {
    const response = await fetch(
        `${API_BASE_URL}/events/${eventId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Failed to delete event.");
    }

    setUpcomingEvents((previousEvents) =>
        previousEvents.filter((event) => event.id !== eventId)
    );
};



/* Sidebar drawer for mobile viewports */
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
useEffect(() => {
    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            setIsSidebarOpen(false);
        }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
        window.removeEventListener("keydown", handleKeyDown);
    };
}, []);



return (
    <>
        <Header
            onMenuToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
        />

        {isSidebarOpen && (
            <button
                type="button"
                className="sidebar-backdrop"
                aria-label="Close navigation menu"
                onClick={() => setIsSidebarOpen(false)}
            />
        )}

        <div className="dashboard-layout">
            <Sidebar
                isOpen={isSidebarOpen}
                onNavigate={() => setIsSidebarOpen(false)}
            />

            <main className="dashboard-content">
                {isSubscriptionExemptRoute ||
                (!subscriptionAccessLoading && subscriptionAccess?.allowed === true) ? (
                    <Outlet
                     context={{
                        payments,
                        setPayments,
                        financialAccounts,
                        setFinancialAccounts,
                        financialAccountsLoading,
                        financialAccountsError,
                        enrollments,
                        setEnrollments,
                        students,
                        setStudents,
                        studentsLoading,
                        studentsError,
                        teachers,
                        setTeachers,
                        staffCount,
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
                        academicSetupLoading,
                        academicSetupError,
                        streams,
                        setStreams,
                        streamLevels,
                        setStreamLevels,
                        subjectCombinations,
                        setSubjectCombinations,
                        attendance,
                        setAttendance,
                        recentActivities,
                        setRecentActivities,
                        refreshRecentActivities,
                        refreshAcademicData: () =>
                          setAcademicDataRefreshKey((prev) => prev + 1),
                        upcomingEvents,
                        createEvent,
                        updateEvent,
                        deleteEvent,
                        subjects,
                        setSubjects,
                        results,
                        setResults,
                    }}
                />
                    ) : subscriptionAccessLoading ? (
          <section className="subscription-access-screen">
              <div className="subscription-access-card">
                  <div className="subscription-access-icon">...</div>
                  <h2>Checking subscription access</h2>
                  <p>
                      Please wait while we verify your school's subscription.
                  </p>
              </div>
          </section>
    ) : subscriptionAccess?.state === "restricted" ? (
        <section className="subscription-access-screen">
            <div className="subscription-access-card">
                <div className="subscription-access-icon">!</div>
                <h2>Subscription access paused</h2>
                <p>
                    Your school's subscription grace period has ended.
                    Renew your subscription to restore access to the
                    school's operational modules. Your school data
                    remains safe and has not been deleted or compromised.
                </p>

                <div className="subscription-access-actions">
                    <Link
                        to="/dashboard/subscription"
                        className="subscription-access-button"
                    >
                        View subscription
                    </Link>
                </div>
            </div>
        </section>
    ) : (
        <section className="subscription-access-screen">
            <div className="subscription-access-card">
                <div className="subscription-access-icon">!</div>
                <h2>Unable to verify subscription</h2>
                <p>
                    We couldn't confirm your school's subscription
                    access. Operational modules remain unavailable
                    until verification succeeds.
                </p>

                {subscriptionAccessError && (
                    <p>{subscriptionAccessError}</p>
                )}

                <div className="subscription-access-actions">
                    <button
                        type="button"
                        className="subscription-access-button"
                        onClick={() => refreshSubscriptionAccess()}
                    >
                        Try again
                    </button>

                    <Link
                        to="/dashboard/subscription"
                        className="subscription-access-button subscription-access-button--secondary"
                    >
                        View subscription
                    </Link>
                </div>
            </div>
        </section>
    )}
            </main>
        </div>
    </>
);

}

export default DashboardLayout