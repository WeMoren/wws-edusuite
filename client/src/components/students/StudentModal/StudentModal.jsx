import {useEffect, useState } from "react"
import React from 'react'
import "./StudentModal.css"


const StudentModal = ({onClose, onAddStudent, studentToEdit}) => {
    const [student, setStudent] = useState({
        admissionNo:"",
        firstName:"",
        lastName:"",
        class:"",
        gender:"Male"
    })

    useEffect(() =>{
        if(studentToEdit){
            setStudent(studentToEdit)
        }
    },  [studentToEdit])

    const handleChange = (e) =>  {
        const  {name, value} = e.target;

        setStudent((prevStudent)  => ({
            ...prevStudent,
            [name]: value,
        }))
    }


    const handleSubmit = (e) => {
        e.preventDefault();
        onAddStudent(student, studentToEdit)
        setStudent(initialStudent)
        
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
                    <label htmlFor="">class</label>
                    <input 
                        type="text" 
                        name="class"
                        value={student.class}
                        onChange={handleChange}
                        placeholder='Enter class'
                         required 
                    />
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