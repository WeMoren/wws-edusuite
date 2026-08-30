import React, { useEffect, useState } from "react";
import "./StudentModal.css";

const StudentModal = ({
  onClose,
  onAddStudent,
  studentToEdit,
  academicSessions,
  academicLevels,
  sections,
  classes,
  enrollments
}) => {
  const [student, setStudent] = useState({
    admissionNo: "",
    firstName: "",
    lastName: "",
    gender: "Male",
  });

  const [enrollment, setEnrollment] = useState({
    academicSessionId: "",
    academicLevelId: "",
    classId: "",
    sectionId: "",
  });

      /* UseEffect */

        useEffect(() => {
            if (!studentToEdit) {
              return;
            }

            setStudent(studentToEdit);

            const studentEnrollment = enrollments.find(
              (enrollment) => enrollment.studentId === studentToEdit.id
            );

            if (studentEnrollment) {
              setEnrollment({
                academicSessionId: studentEnrollment.academicSessionId,
                academicLevelId: studentEnrollment.academicLevelId,
                classId: studentEnrollment.classId,
                sectionId: studentEnrollment.sectionId,
              });
            }
          }, [studentToEdit, enrollments]);


      /* Handle change */
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (
      name === "academicSessionId" ||
      name === "academicLevelId" ||
      name === "classId" ||
      name === "sectionId"
    ) {
      setEnrollment((prev) => ({
        ...prev,
        [name]: Number(value),
      }));
      return;
    }

    setStudent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };



  // ✅ Filter sections by both level and session
  const availableSections = sections.filter((section) => {
    const schoolClass = classes.find((c) => c.id === section.classId);
    return (
      schoolClass &&
      schoolClass.academicLevelId === Number(enrollment.academicLevelId) &&
      schoolClass.academicSessionId === Number(enrollment.academicSessionId)
    );
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddStudent(student, enrollment, studentToEdit);

    setStudent({
      admissionNo: "",
      firstName: "",
      lastName: "",
      gender: "Male",
    });

    setEnrollment({
      academicSessionId: "",
      academicLevelId: "",
      classId: "",
      sectionId: "",
    });
  };

  return (
    <div className="student-modal-overlay" onClick={onClose}>
      <div className="student-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{studentToEdit ? "Edit Student" : "Add Student"}</h2>

        <button className="student-modal__close" onClick={onClose}>
          ✕
        </button>

        <form className="student-form" onSubmit={handleSubmit}>
          {/* Admission number */}
          <div className="student-form__group">
            <label>Admission Number</label>
            <input
              type="text"
              name="admissionNo"
              value={student.admissionNo}
              onChange={handleChange}
              placeholder="Enter admission number"
              required
            />
          </div>

          {/* First name */}
          <div className="student-form__group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={student.firstName}
              onChange={handleChange}
              placeholder="Enter first name"
              required
            />
          </div>

          {/* Last name */}
          <div className="student-form__group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={student.lastName}
              onChange={handleChange}
              placeholder="Enter last name"
              required
            />
          </div>

          {/* Academic session */}
          <div className="student-form__group">
            <label htmlFor="academicSessionId">Academic Session</label>
            <select
              id="academicSessionId"
              name="academicSessionId"
              value={enrollment.academicSessionId}
              onChange={handleChange}
              required
            >
              <option value="">Select academic session</option>
              {academicSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>

          {/* Academic level */}
          <div className="student-form__group">
            <label htmlFor="academicLevelId">Academic Level</label>
            <select
              id="academicLevelId"
              name="academicLevelId"
              value={enrollment.academicLevelId}
              onChange={handleChange}
              required
            >
              <option value="">Select academic level</option>
              {academicLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class + Section */}
          <div className="student-form__group">
            <label htmlFor="sectionId">Class + Section</label>
            <select
              id="sectionId"
              name="sectionId"
              value={enrollment.sectionId}
              onChange={(e) => {
                const sectionId = Number(e.target.value);
                const selectedSection = sections.find(
                  (s) => s.id === sectionId
                );
                setEnrollment((prev) => ({
                  ...prev,
                  sectionId,
                  classId: selectedSection ? selectedSection.classId : "",
                }));
              }}
              disabled={
                !enrollment.academicLevelId || !enrollment.academicSessionId
              }
              required
            >
              <option value="">Select class + section</option>
              {availableSections.map((section) => {
                const schoolClass = classes.find(
                  (c) => c.id === section.classId
                );
                return (
                  <option key={section.id} value={section.id}>
                    {schoolClass?.name} - {section.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Gender */}
          <div className="student-form__group">
            <label>Gender</label>
            <select
              name="gender"
              value={student.gender}
              onChange={handleChange}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <button type="submit" className="student-form__button">
            Save Student
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentModal;
