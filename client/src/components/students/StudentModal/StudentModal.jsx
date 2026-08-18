import {useEffect, useState } from "react"
import React from 'react'
import "./StudentModal.css"
import academicSessions from "../../../data/academicSessions";
import academicLevels from "../../../data/academicLevels";
import sections from "../../../data/sections";
import classes from "../../../data/classes";



const StudentModal = ({onClose, onAddStudent, studentToEdit}) => {
    const [student, setStudent] = useState({
        admissionNo:"",
        firstName:"",
        lastName:"",
        class:"",
        gender:"Male"
    });


    const [enrollment, setEnrollment] = useState({
        academicSessionId: "",
        academicLevelId: "",
        classId:"",
        sectionId: ""
    });

    useEffect(() =>{
        if(studentToEdit){
            setStudent(studentToEdit)
        }
    },  [studentToEdit])

    const handleChange = (e) =>  {
        const  {name, value} = e.target;


        if (
                name === "academicSessionId" ||
                name === "academicLevelId" ||
                name === "classId" ||
                name === "sectionId"
        ) {
            setEnrollment((prevEnrollment) => ({
                ...prevEnrollment,
                [name]: value,
            }));

            return;
        }


        setStudent((prevStudent)  => ({
            ...prevStudent,
            [name]: value,
        }))
    }


    const selectedClass = classes.find(
             (classItem) =>
            classItem.id === Number(enrollment.classId)
    );

    const availableSections = sections.filter(
        (section) =>
        section.classId === selectedClass?.id
    );


    const handleSubmit = (e) => {
        e.preventDefault();
        onAddStudent(student, enrollment, studentToEdit)
       

        setStudent({
        admissionNo: "",
        firstName: "",
        lastName: "",
        gender: "Male"
    });


    setEnrollment({
        academicSessionId: "",
        academicLevelId: "",
        classId:"",
        sectionId: ""
    });
        
    }


  return (
    <div className='student-modal-overlay'
             onClick={onClose}>

        <div className="student-modal" 
             onClick={(e) => e.stopPropagation() }>

            <h2>Add Student</h2>

            <button className="student-modal__close"
                onClick={onClose}
            >
                 ✕
            </button>
            <form 
                action="" 
                className="student-form"
                onSubmit={handleSubmit}
            >
                <div className="student-form__group">
                    <label htmlFor="">Admission Number</label>
                    <input 
                        type="text"
                        name="admissionNo"
                        value={student.admissionNo}
                        onChange={handleChange}    
                        placeholder='Enter admission number'
                        required
                     />

                </div>

                <div className="student-form__group">
                    <label htmlFor="">First Name</label>
                    <input
                        type="text"
                        name="firstName"
                        value={student.firstName}
                        onChange={handleChange}   
                        placeholder='Enter first name' 
                        required
                     />
                </div>

                <div className="student-form__group">
                    <label htmlFor="">Last Name</label>
                    <input 
                        type="text" 
                        name="lastName"
                        value={student.lastName}
                        onChange={handleChange}
                        placeholder='Enter last name'
                        required
                    />
                </div>


                <div className="student-form__group">
                    <label htmlFor="academicSessionId">
                        Academic Session
                    </label>

                    <select
                        id="academicSessionId"
                        name="academicSessionId"
                        value={enrollment.academicSessionId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">
                            Select academic session
                        </option>

                        {academicSessions.map((session) => (
                            <option
                                key={session.id}
                                value={session.id}
                            >
                                {session.name}
                            </option>
                        ))}
                    </select>

                <div className="student-form__group">
                        <label htmlFor="academicLevelId">
                            Academic Level
                        </label>

                        <select
                            id="academicLevelId"
                            name="academicLevelId"
                            value={enrollment.academicLevelId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">
                                Select academic level
                            </option>

                            {academicLevels.map((level) => (
                                <option
                                    key={level.id}
                                    value={level.id}
                                >
                                    {level.name}
                                </option>
                            ))}
                        </select>

                    <div className="student-form__group">
                        <label htmlFor="sectionId">
                            Section
                        </label>

                        <select
                            id="sectionId"
                            name="sectionId"
                            value={enrollment.sectionId}
                            onChange={handleChange}
                            disabled={!enrollment.classId}
                            
                        >
                            <option value="">
                                Select section
                            </option>

                            {availableSections.map((section) => {
                                const classItem = classes.find(
                                    (classItem) => classItem.id === section.classId
                                );

                                return (
                                    <option
                                        key={section.id}
                                        value={section.id}
                                    >
                                        {classItem?.name} - {section.name}
                                    </option>
                                );
                            })}
                        </select>
                </div>



                <div className="student-form__group">
                            <label htmlFor="classId">
                                Class
                            </label>

                            <select
                                id="classId"
                                name="classId"
                                value={enrollment.classId}
                                onChange={handleChange}
                                disabled={!enrollment.academicLevelId}
                            >
                                <option value="">
                                    Select class
                                </option>

                                {classes
                                    .filter(
                                        (classItem) =>
                                            classItem.academicLevelId ===
                                            Number(enrollment.academicLevelId)
                                    )
                                    .map((classItem) => (
                                        <option
                                            key={classItem.id}
                                            value={classItem.id}
                                        >
                                            {classItem.name}
                                        </option>
                                    ))}
                            </select>
                </div>


                </div>
                </div>

               

                <div className="student-form__group">
                    <label htmlFor="">Gender</label>

                    <select
                         name="gender"
                         value={student.gender} 
                        onChange={handleChange}
                    >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>

                <button type='submit' className="student-form__button">
                    Save Student
                </button>
            </form>
        </div>
    </div>
  )
}

export default StudentModal 