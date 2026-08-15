import React, {useEffect, useState} from 'react'
import { useOutletContext } from 'react-router-dom'
import initialClasses from '../../data/classes'
import ClassTable from '../../components/classes/ClassTable/ClassTable'
import "./Classes.css"
import ClassModal from '../../components/classes/ClassModal/ClassModal'
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";



const Classes = () => {
    const [classToDelete, setClassToDelete] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [levelFilter, setLevelFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const classesPerPage = 5;


    const { classes, setClasses } = useOutletContext();

    useEffect(() => {
        localStorage.setItem("classes", JSON.stringify(classes))
    }, [classes]);


        useEffect(() => {
    setCurrentPage(1);
    }, [searchTerm, levelFilter]);


    const filteredClasses = classes.filter((schoolClass) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
        schoolClass.name.toLowerCase().includes(search) ||
        schoolClass.level.toLowerCase().includes(search) ||
        schoolClass.classTeacher.toLowerCase().includes(search) ||
        schoolClass.room.toLowerCase().includes(search);

    const matchesLevel =
        levelFilter === "" ||
        schoolClass.level === levelFilter;

    return matchesSearch && matchesLevel;
});

        const totalPages = Math.ceil(
            filteredClasses.length / classesPerPage
);

        const startIndex = (currentPage - 1) * classesPerPage;

        const currentClasses = filteredClasses.slice(
                startIndex,
                startIndex + classesPerPage
);

  return (
    <div className="classes-page">
        <div className="classes-page__header">
            <h1>Classes</h1>
            <button 
                className="classes-page__button"
                onClick={() => setShowModal(true)}
            >
                + Add Class
            </button>
        </div>


        <div className="classes-page__filters">
            <input
                type="text"
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

        <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
        >
            <option value="">All Levels</option>
            <option value="JSS 1">JSS 1</option>
            <option value="JSS 2">JSS 2</option>
            <option value="JSS 3">JSS 3</option>
            <option value="SS 1">SS 1</option>
            <option value="SS 2">SS 2</option>
            <option value="SS 3">SS 3</option>
        </select>
</div>


        <ClassTable  classes={currentClasses}
                    
            onEdit={(schoolClass) => {
                setEditingClass(schoolClass);
                setShowModal(true);
            }}

                onDelete={(classId) => {
                     const selectedClass = classes.find(
            (schoolClass) => schoolClass.id === classId
  );

  setClassToDelete(selectedClass);
}}
       />



            {totalPages > 1 && (
                        <div className="classes-page__pagination">
                            <button
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                            disabled={currentPage === 1}
                            >
                            Previous
                            </button>

                            <span>
                            Page {currentPage} of {totalPages}
                            </span>

                            <button
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            disabled={currentPage === totalPages}
                            >
                            Next
                            </button>
                        </div>
        )}

            {classToDelete && (
            <ConfirmDialog
                title="Delete Class"
                message={`Are you sure you want to delete ${classToDelete.name}?`}
                onCancel={() => setClassToDelete(null)}
                onConfirm={() => {
                setClasses((prevClasses) =>
                    prevClasses.filter(
                    (schoolClass) => schoolClass.id !== classToDelete.id
                    )
                );

      setClassToDelete(null);
    }}
  />
)}



        {showModal && (
            <ClassModal
                onClose={() => {
                setShowModal(false);
                setEditingClass(null);
    }}
    editingClass={editingClass}
    onAddClass={(classData) => {
      if (editingClass) {
        setClasses((prevClasses) =>
          prevClasses.map((schoolClass) =>
            schoolClass.id === editingClass.id
              ? {
                  ...classData,
                  id: editingClass.id,
                }
              : schoolClass
          )
        );

        setEditingClass(null);
        setShowModal(false);
      } else {
        setClasses((prevClasses) => [
          ...prevClasses,
          {
            ...classData,
            id:
              prevClasses.length > 0
                ? Math.max(
                    ...prevClasses.map(
                      (schoolClass) => schoolClass.id
                    )
                  ) + 1
                : 1,
          },
        ]);

        setShowModal(false);
      }
    }}
  />
)}
        
    </div>
  )
}

export default Classes