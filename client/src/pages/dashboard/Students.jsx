import React, {useState} from 'react'
import StudentTable from '../../components/students/StudentTable'
import "./Students.css"
import StudentModal from '../../components/students/StudentModal/StudentModal'

const Students = () => {
    const [showModal, setShowModal] = useState(false)
  return (
    <div className='student-page'>
        <div className="students-page__header">
             <h1>Students</h1>

             <button
                 className="students-page__button"
                onClick={() => setShowModal(true)}
             >
                + Add Student
             </button>
        </div>

        <StudentTable/>

        {showModal && (
            <StudentModal
                onClose={() => setShowModal(false) }
        />)}

    </div>
  )
}

export default Students