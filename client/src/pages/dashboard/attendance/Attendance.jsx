import React, { useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { useOutletContext } from "react-router-dom";
import "./Attendance.css";

const Attendance = () => {
  const { authToken } = useAuth();
  const API_BASE_URL = "http://localhost:5000/api";

  const [savingStudentId, setSavingStudentId] = useState(null);
  const [attendanceError, setAttendanceError] = useState("");

  const {
    students = [],
    classes = [],
    enrollments = [],
    sections = [],
    attendance = [],
    setAttendance,
    setRecentActivities,
    academicSessions = [],
    academicTerms = [],
  } = useOutletContext();

  const [selectedDate, setSelectedDate] = useState(
    () =>
      localStorage.getItem("selectedDate") ||
      new Date().toISOString().split("T")[0]
  );

  // Academic IDs are UUID strings, not numbers.
  const [selectedSessionId, setSelectedSessionId] = useState(
    () => localStorage.getItem("attendanceSelectedSessionId") || ""
  );

  const [selectedTermId, setSelectedTermId] = useState(
    () => localStorage.getItem("attendanceSelectedTermId") || ""
  );

  const [selectedClassId, setSelectedClassId] = useState(
    () => localStorage.getItem("selectedClassId") || ""
  );

  const [attendanceStatus, setAttendanceStatus] = useState({});

  // Compare IDs consistently, whether an older record contains a number
  // or a newer record contains a UUID string.
  const sameId = (firstId, secondId) =>
    firstId != null &&
    secondId != null &&
    String(firstId) === String(secondId);

  /* --------------------------------
      Persist selections
  -------------------------------- */

  useEffect(() => {
    localStorage.setItem("selectedDate", selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (selectedSessionId) {
      localStorage.setItem(
        "attendanceSelectedSessionId",
        selectedSessionId
      );
    } else {
      localStorage.removeItem("attendanceSelectedSessionId");
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (selectedTermId) {
      localStorage.setItem(
        "attendanceSelectedTermId",
        selectedTermId
      );
    } else {
      localStorage.removeItem("attendanceSelectedTermId");
    }
  }, [selectedTermId]);

  useEffect(() => {
    if (selectedClassId) {
      localStorage.setItem("selectedClassId", selectedClassId);
    } else {
      localStorage.removeItem("selectedClassId");
    }
  }, [selectedClassId]);

  /* --------------------------------
      Academic term filtering
  -------------------------------- */

  const availableTerms = academicTerms.filter((term) =>
    sameId(term.academicSessionId, selectedSessionId)
  );

  /* --------------------------------
      Students in selected class/session
  -------------------------------- */

  const selectedClassStudents = students.filter((student) => {
    const enrollment = enrollments.find(
      (item) =>
        sameId(item.studentId, student.id) &&
        sameId(item.academicSessionId, selectedSessionId)
    );

    if (!enrollment) {
      return false;
    }

    const section = sections.find((item) =>
      sameId(item.id, enrollment.sectionId)
    );

    return sameId(section?.classId, selectedClassId);
  });

  /* --------------------------------
      Load existing attendance
  -------------------------------- */

  useEffect(() => {
    if (
      !selectedSessionId ||
      !selectedTermId ||
      !selectedClassId ||
      !selectedDate
    ) {
      setAttendanceStatus({});
      return;
    }

    const existingAttendance = attendance.filter(
      (record) =>
        sameId(record.academicSessionId, selectedSessionId) &&
        sameId(record.academicTermId, selectedTermId) &&
        sameId(record.classId, selectedClassId) &&
        record.date === selectedDate
    );

    const existingStatus = existingAttendance.reduce(
      (status, record) => {
        status[String(record.studentId)] = record.status;
        return status;
      },
      {}
    );

    setAttendanceStatus(existingStatus);
  }, [
    selectedSessionId,
    selectedTermId,
    selectedClassId,
    selectedDate,
    attendance,
  ]);

  /* --------------------------------
      Daily attendance summary
  -------------------------------- */

  const totalStudents = selectedClassStudents.length;

  const presentCount = selectedClassStudents.filter(
    (student) =>
      attendanceStatus[String(student.id)] === "present"
  ).length;

  const absentCount = selectedClassStudents.filter(
    (student) =>
      attendanceStatus[String(student.id)] === "absent"
  ).length;

  const unmarkedCount = totalStudents - presentCount - absentCount;

  const attendancePercentage =
    totalStudents > 0
      ? Math.round((presentCount / totalStudents) * 100)
      : 0;

  /* --------------------------------
      Change attendance status
  -------------------------------- */


const handleStatusChange = async (studentId, status) => {
  if (
    !authToken ||
    !selectedSessionId ||
    !selectedTermId ||
    !selectedClassId ||
    !selectedDate ||
    savingStudentId !== null
  ) {
    setAttendanceError(
      !authToken ? "Your session has expired. Please log in again." : ""
    );
    return;
  }

  const enrollment = enrollments.find(
    (item) =>
      sameId(item.studentId, studentId) &&
      sameId(item.academicSessionId, selectedSessionId) &&
      sameId(item.classId, selectedClassId)
  );

  if (!enrollment) {
    setAttendanceError(
      "Could not find this student's enrollment in the selected class."
    );
    return;
  }

  setSavingStudentId(studentId);
  setAttendanceError("");

  try {
    const response = await fetch(
      `${API_BASE_URL}/attendance/batch`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          academicSessionId: selectedSessionId,
          academicTermId: selectedTermId,
          classId: selectedClassId,
          attendanceDate: selectedDate,
          records: [
            {
              enrollmentId: enrollment.id,
              status,
            },
          ],
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to save attendance."
      );
    }

    // Reload the records from the backend after saving.
    const refreshResponse = await fetch(
      `${API_BASE_URL}/attendance`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const refreshedData = await refreshResponse
      .json()
      .catch(() => ({}));

    if (!refreshResponse.ok) {
      throw new Error(
        refreshedData.message ||
          "Attendance was saved, but refreshing the records failed."
      );
    }

    const refreshedAttendance = (
      refreshedData.attendance || []
    ).map((record) => ({
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
    }));

    setAttendance(refreshedAttendance);

    setRecentActivities((previousActivities) => [
      {
        id: Date.now(),
        activity: `Attendance marked for ${
          classes.find((item) =>
            sameId(item.id, selectedClassId)
          )?.name || "Selected Class"
        }`,
        createdAt: new Date().toISOString(),
      },
      ...previousActivities,
    ]);
  } catch (error) {
    setAttendanceError(error.message);
  } finally {
    setSavingStudentId(null);
  }
};

  return (
    <div className="attendance">
      <h1>Attendance</h1>

      <p>Manage student attendance.</p>

      {attendanceError && (
        <p role="alert" className="attendance__error">
          {attendanceError}
        </p>
       )}

      <div className="attendance__filters">
        <div className="attendance__field">
          <label htmlFor="attendance-session">
            Academic Session
          </label>

          <select
            id="attendance-session"
            value={selectedSessionId}
            onChange={(event) => {
              setSelectedSessionId(event.target.value);
              setSelectedTermId("");
              setSelectedClassId("");
              setAttendanceStatus({});
            }}
          >
            <option value="">Select session</option>

            {academicSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </select>
        </div>

        <div className="attendance__field">
          <label htmlFor="attendance-term">
            Academic Term
          </label>

          <select
            id="attendance-term"
            value={selectedTermId}
            onChange={(event) => {
              setSelectedTermId(event.target.value);
              setSelectedClassId("");
              setAttendanceStatus({});
            }}
            disabled={!selectedSessionId}
          >
            <option value="">Select term</option>

            {availableTerms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </div>

        <div className="attendance__field">
          <label htmlFor="attendance-date">Date</label>

          <input
            id="attendance-date"
            type="date"
            value={selectedDate}
            onChange={(event) =>
              setSelectedDate(event.target.value)
            }
          />
        </div>

        <div className="attendance__field">
          <label htmlFor="attendance-class">Class</label>

          <select
            id="attendance-class"
            value={selectedClassId}
            onChange={(event) => {
              setSelectedClassId(event.target.value);
              setAttendanceStatus({});
            }}
            disabled={!selectedSessionId || !selectedTermId}
          >
            <option value="">Select class</option>

            {classes
              .filter((schoolClass) =>
                sameId(
                  schoolClass.academicSessionId,
                  selectedSessionId
                )
              )
              .map((schoolClass) => (
                <option
                  key={schoolClass.id}
                  value={schoolClass.id}
                >
                  {schoolClass.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {selectedClassId &&
        selectedSessionId &&
        selectedTermId && (
          <>
            <div className="attendance__summary">
              <div className="attendance__summary-card">
                <span>Total Students</span>
                <strong>{totalStudents}</strong>
              </div>

              <div className="attendance__summary-card">
                <span>Present</span>
                <strong>{presentCount}</strong>
              </div>

              <div className="attendance__summary-card">
                <span>Absent</span>
                <strong>{absentCount}</strong>
              </div>

              <div className="attendance__summary-card">
                <span>Unmarked</span>
                <strong>{unmarkedCount}</strong>
              </div>

              <div className="attendance__summary-card">
                <span>Attendance Rate</span>
                <strong>{attendancePercentage}%</strong>
              </div>
            </div>

            <div className="attendance__students">
              <h2>Students</h2>

              {selectedClassStudents.length > 0 ? (
                <div className="attendance__list">
                  {selectedClassStudents.map((student) => {
                    const status =
                      attendanceStatus[String(student.id)];

                    const fullName = [
                      student.firstName,
                      student.middleName,
                      student.lastName,
                    ]
                      .filter(
                        (name) =>
                          typeof name === "string" &&
                          name.trim() !== ""
                      )
                      .map((name) => name.trim())
                      .join(" ");

                    return (
                      <div
                        key={student.id}
                        className="attendance__student"
                      >
                        <div>
                          <strong>{fullName}</strong>
                          <span>{student.admissionNo}</span>
                        </div>

                        <div className="attendance__status">
                          <button
                            type="button"
                            className={
                              status === "present"
                                ? "attendance__status--active"
                                : ""
                            }
                            onClick={() =>
                              handleStatusChange(
                                student.id,
                                "present"
                              )
                            }
                          >
                            Present
                          </button>

                          <button
                            type="button"
                            className={
                              status === "absent"
                                ? "attendance__status--active"
                                : ""
                            }
                            onClick={() =>
                              handleStatusChange(
                                student.id,
                                "absent"
                              )
                            }
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>No students found in this class.</p>
              )}
            </div>
          </>
        )}

      {!selectedSessionId && (
        <p className="attendance__empty">
          Select an academic session to begin.
        </p>
      )}

      {selectedSessionId && !selectedTermId && (
        <p className="attendance__empty">
          Select an academic term to continue.
        </p>
      )}

      {selectedSessionId &&
        selectedTermId &&
        !selectedClassId && (
          <p className="attendance__empty">
            Select a class to view students.
          </p>
        )}
    </div>
  );
};

export default Attendance;