import React, { useState } from 'react'
import "./TeacherModal.css"
const TeacherModal = ({onClose, onAddTeacher, editingTeacher}) => {

    const  [teacher, setTeacher] = useState(
        editingTeacher  || {
        staffId:"",
        firstName:"",
        lastName:"",
        subject:"",
        gender:""
    });

    const handleChange = (e) => {
        const {name, value} = e.target;

        setTeacher((prev)  => ({
            ...prev,
             [name]:value
        }))
    }


    const handleSubmit = (e)  =>  {
        e.preventDefault();

        onAddTeacher(teacher)
    }

    
  return (
    <div className='teacher-modal__overlay'>
        <div className="teacher-modal">

            <div className="teacher-modal__header">
                <h2>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</h2>
                <button onClick={onClose}>x</button>
            </div>

            <form action="" onSubmit={handleSubmit}>
                <div className="teacher-form__group">
                    <label>Staff ID</label>
                    <input 
                        type="text"
                        name='staffId'
                        value={teacher.staffId}
                        onChange={handleChange}
                        placeholder='Enter staff ID'
                        required
                        />
                </div>

                <div className="teacher-form__group">
                    <label>First Name</label>
                    <input 
                        type="text"
                        name='firstName'
                        value={teacher.firstName}
                        onChange={handleChange}
                        placeholder='Enter first name'
                        required
                        />
                </div>

                <div className="teacher-form__group">
                    <label>Last Name</label>
                    <input 
                        type="text"
                        name='lastName'
                        value={teacher.lastName}
                        onChange={handleChange}
                        placeholder='Enter last name'
                        required
                        />
                </div>

                <div className="teacher-form__group">
                    <label>Subject</label>
                    <input 
                        type="text"
                        name='subject'
                        value={teacher.subject}
                        onChange={handleChange}
                        placeholder='Enter subject'
                        required
                        />
                </div>

                <div className="teacher form__group">
                    <label>Gender</label>

                    <select 
                        name="gender"
                        value={teacher.gender}
                        onChange={handleChange}
                        required
                        >
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                </div>

                <button type='submit'>
                    Add Teacher
                </button>
            </form>

        </div>
    </div>
  )
}

export default TeacherModal