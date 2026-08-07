import React from 'react'
import "./StudentModal.css"

const StudentModal = ({onClose}) => {
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
            <form action="" className="student-form">
                <div className="student-form__group">
                    <label htmlFor="">Admission Number</label>
                    <input type="text" placeholder='Enter admission number' />

                </div>

                <div className="student-form__group">
                    <label htmlFor="">First Name</label>
                    <input type="text" placeholder='Enter first name'/>
                </div>

                <div className="student-form__group">
                    <label htmlFor="">Last Name</label>
                    <input type="text" placeholder='Enter last name'/>
                </div>

                <div className="student-form__group">
                    <label htmlFor="">class</label>
                    <input type="text" placeholder='Enter class' />
                </div>

                <div className="student-form__group">
                    <label htmlFor="">Gender</label>

                    <select name="" id="">
                        <option value="">Male</option>
                        <option value="">Female</option>
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