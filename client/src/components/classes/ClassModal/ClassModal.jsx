import React, {useState} from 'react';
import "./ClassModal.css";
import teachers from '../../../data/teachers';
const ClassModal = ({onClose, onAddClass, editingClass}) => {

    const [classData, setClassData] = useState(
         editingClass  ||  { 
        name:"",
        level:"",
        classTeacher:"",
        room:"",
        capacity:""
    });

    const handleChange = (e) => {
        const {name, value} = e.target;

        setClassData((prev) => ({
            ...prev, [name] : value
        }));
    };

    const handleSubmit = (e)  =>  {
        e.preventDefault();

        onAddClass(classData)
    }

  return (
    <div className="class-modal__overlay">
        <div className="class-modal">
            <div className="class-modal__header">
                <h2>{editingClass ? "Edit Class" : "Add Class"}</h2>

                <button onClick={onClose}>x</button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="class-form__group">
                    <label htmlFor="name"> Class Name</label>
                    <input 
                        id='name'
                        type="text"
                        name='name'
                        value={classData.name}
                        onChange={handleChange}
                        placeholder='e.g. JSS 1A'
                        required
                    />
                </div>

                <div className="class-form__group">
                    <label htmlFor="level">Level</label>
                    <input 
                        type="text" 
                        id="level" 
                        name='level'
                        value={classData.level}
                        onChange={handleChange}
                        placeholder='e.g. JSS 1'
                        required
                    />

                    <div className="class-form__group">
                        <label htmlFor="classTeacher">Class Teacher</label>
                        <select
                             name="classTeacher" 
                             id="classTeacher"
                             value={classData.classTeacher}
                             onChange={handleChange}
                            required
                        >
                            <option value="">Select a teacher</option>
                            {teachers.map((teacher)  => (
                                <option key={teacher.id} 
                                value={`${teacher.firstName} ${teacher.lastName}`}
                            >
                                {teacher.firstName} {teacher.lastName}
                                </option>
                            ))}

                        </select>    
                    </div>

                    <div className="class-form__group">
                        <label htmlFor="room">Room</label>
                        <input
                             type="text" 
                            id="room" 
                            name='room'
                            value={classData.room}
                            onChange={handleChange}
                            placeholder='e.g. Room 101'
                            required
                        />
                    </div>

                    <div className="class-form__group">
                        <label htmlFor="capacity">Capacity</label>
                        <input 
                            type="text" 
                            id="capacity" 
                            name='capacity'
                            value={classData.capacity}
                            onChange={handleChange}
                            placeholder='e.g. 40'
                            min="1"
                            required
                        />
                    </div>
                </div>

                <button type="submit">{editingClass ? "Save Changes" : "Add Class"}</button>
            </form>
        </div>
    </div>
  )
}

export default ClassModal