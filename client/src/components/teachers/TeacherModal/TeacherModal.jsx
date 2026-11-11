import React, { useState } from 'react'
import "./TeacherModal.css"
const TeacherModal = ({onClose, onAddTeacher, editingTeacher}) => {

    const  [teacher, setTeacher] = useState(
        editingTeacher  || {
        staffId:"",
        firstName:"",
        lastName:"",
        subject:"",
        email:"",
        phoneNum:"",
        gender:""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const handleChange = (e) => {
        const {name, value} = e.target;

        setTeacher((prev)  => ({
            ...prev,
             [name]:value
        }))
    }


    const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSubmitError("");

    try {
        await onAddTeacher(teacher);
    } catch (error) {
        setSubmitError(error.message || "Failed to save teacher.");
    } finally {
        setIsSubmitting(false);
    }
};

  return (
    <div className='teacher-modal__overlay'>
        <div className="teacher-modal">

            <div className="teacher-modal__header">
                <h2>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</h2>
                <button onClick={onClose} disabled={isSubmitting}>x</button>
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


                 <div className="teacher-form__group">
                    <label>Email</label>
                    <input
                        type="email"
                        name='email'
                        value={teacher.email}
                        onChange={handleChange}
                        placeholder='Enter email address e.g name@example.com'
                        required
                        />
                </div>


                <div className="teacher-form__group">
                    <label>Phone Number</label>
                    <input
                        type="text"
                        name='phoneNum'
                        value={teacher.phoneNum}
                        onChange={handleChange}
                        placeholder='Enter phone Number'
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



                {submitError && (
                    <p className="teacher-modal__error" role="alert">
                        {submitError}
                    </p>
                )}

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? "Saving..."
                        : editingTeacher
                            ? "Save Changes"
                            : "Add Teacher"}
                </button>
            </form>

        </div>
    </div>
  )
}

export default TeacherModal