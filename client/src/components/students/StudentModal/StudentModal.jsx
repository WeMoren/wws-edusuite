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
  enrollments,
  streams,
  streamLevels,
  subjectCombinations,
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
    streamId: "",
  combinationId: "",
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
                 streamId: studentEnrollment.streamId || "",
                combinationId: studentEnrollment.combinationId || "",
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
    name === "sectionId" ||
    name === "streamId" ||
    name === "combinationId"
  ) {
    setEnrollment((prev) => {
      const numericValue = Number(value);

      if (name === "academicLevelId") {
        return {
          ...prev,
          academicLevelId: numericValue,
          streamId: "",
          combinationId: "",
          classId: "",
          sectionId: "",
        };
      }

      if (name === "streamId") {
        return {
          ...prev,
          streamId: numericValue,
          combinationId: "",
        };
      }

      return {
        ...prev,
        [name]: numericValue,
      };
    });

    return;
  }

  setStudent((prev) => ({
    ...prev,
    [name]: value,
  }));
};



  // Senior secondary stream options
const isSeniorSecondary =
  academicLevels.find(
    (level) =>
      level.id === Number(enrollment.academicLevelId)
  )?.category === "Senior Secondary";

const availableStreams = streams.filter((stream) =>
  streamLevels.some(
    (streamLevel) =>
      streamLevel.streamId === stream.id &&
      streamLevel.academicLevelId ===
        Number(enrollment.academicLevelId) &&
      streamLevel.isActive
  )
);

const availableCombinations = subjectCombinations.filter(
  (combination) =>
    combination.academicLevelId ===
      Number(enrollment.academicLevelId) &&
    combination.streamId === Number(enrollment.streamId) &&
    combination.isActive
);



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
      streamId: "",
      combinationId: "",
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


              {/* Stream */}
        {isSeniorSecondary && (
          <div className="student-form__group">
            <label htmlFor="streamId">Stream</label>

            <select
              id="streamId"
              name="streamId"
              value={enrollment.streamId}
              onChange={handleChange}
              disabled={!enrollment.academicLevelId}
              required
            >
              <option value="">Select stream</option>

              {availableStreams.map((stream) => (
                <option key={stream.id} value={stream.id}>
                  {stream.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Subject Combination */}
        {isSeniorSecondary && (
          <div className="student-form__group">
            <label htmlFor="combinationId">
              Subject Combination
            </label>

            <select
              id="combinationId"
              name="combinationId"
              value={enrollment.combinationId}
              onChange={handleChange}
              disabled={!enrollment.streamId}
              required
            >
              <option value="">
                Select subject combination
              </option>

              {availableCombinations.map((combination) => (
                <option
                  key={combination.id}
                  value={combination.id}
                >
                  {combination.name}
                </option>
              ))}
            </select>
          </div>
        )}


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
