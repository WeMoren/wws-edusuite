import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import "./Attendance.css";

const Attendance = () => {
  const {
    students,
    classes,
    enrollments,
    sections,
    attendance,
    setAttendance,
    setRecentActivities,
    academicSessions,
    academicTerms,
  } = useOutletContext();

  const [selectedDate, setSelectedDate] = useState(
    () =>
      localStorage.getItem("selectedDate") ||
      new Date().toISOString().split("T")[0]
  );

  const [selectedSessionId, setSelectedSessionId] =
    useState(() => {
      const savedSession =
        localStorage.getItem(
          "attendanceSelectedSessionId"
        );

      return savedSession
        ? Number(savedSession)
        : "";
    });

  const [selectedTermId, setSelectedTermId] =
    useState(() => {
      const savedTerm =
        localStorage.getItem(
          "attendanceSelectedTermId"
        );

      return savedTerm
        ? Number(savedTerm)
        : "";
    });

  const [selectedClassId, setSelectedClassId] =
    useState(() => {
      const savedClass =
        localStorage.getItem(
          "selectedClassId"
        );

      return savedClass
        ? Number(savedClass)
        : "";
    });

  const [attendanceStatus, setAttendanceStatus] =
    useState({});

  /* --------------------------------
      Persist selections
  -------------------------------- */

  useEffect(() => {
    localStorage.setItem(
      "selectedDate",
      selectedDate
    );
  }, [selectedDate]);

  useEffect(() => {
    if (selectedSessionId) {
      localStorage.setItem(
        "attendanceSelectedSessionId",
        selectedSessionId
      );
    } else {
      localStorage.removeItem(
        "attendanceSelectedSessionId"
      );
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (selectedTermId) {
      localStorage.setItem(
        "attendanceSelectedTermId",
        selectedTermId
      );
    } else {
      localStorage.removeItem(
        "attendanceSelectedTermId"
      );
    }
  }, [selectedTermId]);

  useEffect(() => {
    if (selectedClassId) {
      localStorage.setItem(
        "selectedClassId",
        selectedClassId
      );
    } else {
      localStorage.removeItem(
        "selectedClassId"
      );
    }
  }, [selectedClassId]);

  /* --------------------------------
      Academic term filtering
  -------------------------------- */

  const availableTerms = academicTerms.filter(
    (term) =>
      term.academicSessionId ===
      Number(selectedSessionId)
  );

  /* --------------------------------
      Students in selected class/session
  -------------------------------- */

  const selectedClassStudents =
    students.filter((student) => {
      const enrollment = enrollments.find(
        (item) =>
          item.studentId === student.id &&
          item.academicSessionId ===
            Number(selectedSessionId)
      );

      if (!enrollment) {
        return false;
      }

      const section = sections.find(
        (item) =>
          item.id === enrollment.sectionId
      );

      return (
        section?.classId ===
        Number(selectedClassId)
      );
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

    const existingAttendance =
      attendance.filter(
        (record) =>
          record.academicSessionId ===
            Number(selectedSessionId) &&
          record.academicTermId ===
            Number(selectedTermId) &&
          record.classId ===
            Number(selectedClassId) &&
          record.date === selectedDate
      );

    const existingStatus =
      existingAttendance.reduce(
        (status, record) => {
          status[record.studentId] =
            record.status;

          return status;
        },
        {}
      );

    setAttendanceStatus(
      existingStatus
    );
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

  const totalStudents =
    selectedClassStudents.length;

  const presentCount =
    selectedClassStudents.filter(
      (student) =>
        attendanceStatus[
          student.id
        ] === "present"
    ).length;

  const absentCount =
    selectedClassStudents.filter(
      (student) =>
        attendanceStatus[
          student.id
        ] === "absent"
    ).length;

  const unmarkedCount =
    totalStudents -
    presentCount -
    absentCount;

  const attendancePercentage =
    totalStudents > 0
      ? Math.round(
          (presentCount /
            totalStudents) *
            100
        )
      : 0;

  /* --------------------------------
      Change attendance status
  -------------------------------- */

  const handleStatusChange = (
    studentId,
    status
  ) => {
    setAttendanceStatus((prev) => ({
      ...prev,
      [studentId]: status,
    }));

    setAttendance((prev) => {
      const existingRecord =
        prev.find(
          (record) =>
            record.studentId ===
              studentId &&
            record.classId ===
              Number(selectedClassId) &&
            record.academicSessionId ===
              Number(selectedSessionId) &&
            record.academicTermId ===
              Number(selectedTermId) &&
            record.date ===
              selectedDate
        );

      if (existingRecord) {
        return prev.map((record) =>
          record.id ===
          existingRecord.id
            ? {
                ...record,
                status,
              }
            : record
        );
      }

      const newId =
        prev.length > 0
          ? Math.max(
              ...prev.map(
                (record) =>
                  record.id
              )
            ) + 1
          : 1;

      setRecentActivities(
        (prevActivities) => [
          {
            id: Date.now(),
            activity: `Attendance marked for ${
              classes.find(
                (schoolClass) =>
                  schoolClass.id ===
                  Number(
                    selectedClassId
                  )
              )?.name ||
              "Class Unavailable"
            }`,
            createdAt:
              new Date().toISOString(),
          },
          ...prevActivities,
        ]
      );

      return [
        ...prev,
        {
          id: newId,
          studentId,
          classId:
            Number(selectedClassId),
          academicSessionId:
            Number(
              selectedSessionId
            ),
          academicTermId:
            Number(selectedTermId),
          date: selectedDate,
          status,
        },
      ];
    });
  };

  return (
    <div className="attendance">
      <h1>Attendance</h1>

      <p>
        Manage student attendance.
      </p>

      <div className="attendance__filters">
        <div className="attendance__field">
          <label htmlFor="attendance-session">
            Academic Session
          </label>

          <select
            id="attendance-session"
            value={
              selectedSessionId
            }
            onChange={(e) => {
              const value = e.target
                .value
                ? Number(
                    e.target.value
                  )
                : "";

              setSelectedSessionId(
                value
              );
              setSelectedTermId("");
              setSelectedClassId(
                ""
              );
              setAttendanceStatus({});
            }}
          >
            <option value="">
              Select session
            </option>

            {academicSessions.map(
              (session) => (
                <option
                  key={session.id}
                  value={session.id}
                >
                  {session.name}
                </option>
              )
            )}
          </select>
        </div>

        <div className="attendance__field">
          <label htmlFor="attendance-term">
            Academic Term
          </label>

          <select
            id="attendance-term"
            value={
              selectedTermId
            }
            onChange={(e) => {
              const value = e.target
                .value
                ? Number(
                    e.target.value
                  )
                : "";

              setSelectedTermId(
                value
              );
              setAttendanceStatus(
                {}
              );
            }}
            disabled={
              !selectedSessionId
            }
          >
            <option value="">
              Select term
            </option>

            {availableTerms.map(
              (term) => (
                <option
                  key={term.id}
                  value={term.id}
                >
                  {term.name}
                </option>
              )
            )}
          </select>
        </div>

        <div className="attendance__field">
          <label htmlFor="attendance-date">
            Date
          </label>

          <input
            id="attendance-date"
            type="date"
            value={selectedDate}
            onChange={(e) =>
              setSelectedDate(
                e.target.value
              )
            }
          />
        </div>

        <div className="attendance__field">
          <label htmlFor="attendance-class">
            Class
          </label>

          <select
            id="attendance-class"
            value={
              selectedClassId
            }
            onChange={(e) =>
              setSelectedClassId(
                e.target.value
                  ? Number(
                      e.target.value
                    )
                  : ""
              )
            }
            disabled={
              !selectedSessionId ||
              !selectedTermId
            }
          >
            <option value="">
              Select class
            </option>

            {classes
              .filter(
                (schoolClass) =>
                  schoolClass.academicSessionId ===
                  Number(
                    selectedSessionId
                  )
              )
              .map(
                (schoolClass) => (
                  <option
                    key={
                      schoolClass.id
                    }
                    value={
                      schoolClass.id
                    }
                  >
                    {
                      schoolClass.name
                    }
                  </option>
                )
              )}
          </select>
        </div>
      </div>

      {selectedClassId &&
        selectedSessionId &&
        selectedTermId && (
          <>
            <div className="attendance__summary">
              <div className="attendance__summary-card">
                <span>
                  Total Students
                </span>

                <strong>
                  {totalStudents}
                </strong>
              </div>

              <div className="attendance__summary-card">
                <span>
                  Present
                </span>

                <strong>
                  {presentCount}
                </strong>
              </div>

              <div className="attendance__summary-card">
                <span>
                  Absent
                </span>

                <strong>
                  {absentCount}
                </strong>
              </div>

              <div className="attendance__summary-card">
                <span>
                  Unmarked
                </span>

                <strong>
                  {unmarkedCount}
                </strong>
              </div>

              <div className="attendance__summary-card">
                <span>
                  Attendance Rate
                </span>

                <strong>
                  {attendancePercentage}%
                </strong>
              </div>
            </div>

            <div className="attendance__students">
              <h2>
                Students
              </h2>

              {selectedClassStudents.length >
              0 ? (
                <div className="attendance__list">
                  {selectedClassStudents.map(
                    (student) => {
                      const status =
                        attendanceStatus[
                          student.id
                        ];

                      return (
                        <div
                          key={
                            student.id
                          }
                          className="attendance__student"
                        >
                          <div>
                            <strong>
                              {
                                student.firstName
                              }{" "}
                              {
                                student.lastName
                              }
                            </strong>

                            <span>
                              {
                                student.admissionNo
                              }
                            </span>
                          </div>

                          <div className="attendance__status">
                            <button
                              type="button"
                              className={
                                status ===
                                "present"
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
                                status ===
                                "absent"
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
                    }
                  )}
                </div>
              ) : (
                <p>
                  No students found in
                  this class.
                </p>
              )}
            </div>
          </>
        )}

      {!selectedSessionId && (
        <p className="attendance__empty">
          Select an academic session
          to begin.
        </p>
      )}

      {selectedSessionId &&
        !selectedTermId && (
          <p className="attendance__empty">
            Select an academic term
            to continue.
          </p>
        )}

      {selectedSessionId &&
        selectedTermId &&
        !selectedClassId && (
          <p className="attendance__empty">
            Select a class to view
            students.
          </p>
        )}
    </div>
  );
};

export default Attendance;