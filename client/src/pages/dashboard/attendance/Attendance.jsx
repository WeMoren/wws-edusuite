import React from "react";
import { useOutletContext } from "react-router-dom";
import "./Attendance.css";

const Attendance = () => {
  const { attendance, setAttendance } = useOutletContext();

  return (
    <div className="attendance">
      <h1>Attendance</h1>
      <p>Manage student attendance.</p>

      <p>Total attendance records: {attendance.length}</p>
    </div>
  );
};

export default Attendance;