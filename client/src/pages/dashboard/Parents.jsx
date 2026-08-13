import React, {useEffect, useState}  from 'react';
import initialParents from "../../data/parents";
import ParentTable from '../../components/parents/ParentTable/ParentTable';
import "./Parents.css"
import ParentModal from "../../components/parents/ParentModal/ParentModal";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
const Parents = () => {
    const [showModal, setShowModal] = useState(false);
    const [parents, setParents] = useState(()  => { 
        const savedParents = localStorage.getItem("parents");

        return savedParents ? JSON.parse(savedParents) : initialParents;
    });


    const [parentToDelete, setParentToDelete] = useState(null);
    const [editingParent, setEditingParent] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
     const [currentPage, setCurrentPage] = useState(1);
    const parentsPerPage = 5;
    

        useEffect(() => {
            setCurrentPage(1);
    }, [searchTerm]);


    const filteredParents = parents.filter((parent) => {
        const search = searchTerm.toLowerCase();    

        return (
            `${parent.firstName} ${parent.lastName}`.toLowerCase().includes(search) ||
            parent.phone.toLowerCase().includes(search) ||
            parent.email.toLowerCase().includes(search) ||
            parent.address.toLowerCase().includes(search) 
        );
    });


            const totalPages = Math.ceil(
                 filteredParents.length / parentsPerPage
            );

            const startIndex = (currentPage - 1) * parentsPerPage;

            const currentParents = filteredParents.slice(
                startIndex,
                startIndex + parentsPerPage
            );

   
        useEffect(() => {
            localStorage.setItem("parents", JSON.stringify(parents))
        }, [parents])

  return (
    <div className='parents-page'>
        <div className="parents-page__header">
            <h1>Parents</h1>
            <button 
                className="parents-page__button"
                onClick={() => setShowModal(true)}
            >
                + Add Parent

            </button>
        </div>

        <div className="parents-page__filters">
                <input
                    type="text"
                    placeholder="Search parents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
        </div>


        <ParentTable
            parents={currentParents}
            onEdit={(parent) => {
                setEditingParent(parent)
                setShowModal(true)
            }}
            onDelete={(parentId) => {
                 const parent = parents.find(
                 (parent) => parent.id === parentId
         );

  setParentToDelete(parent);
}}
     />

     {totalPages > 1 && (
        <div className="parents-page__pagination">
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


{parentToDelete && (
  <ConfirmDialog
    title="Delete Parent"
    message={`Are you sure you want to delete ${parentToDelete.firstName} ${parentToDelete.lastName}?`}
    onCancel={() => setParentToDelete(null)}
    onConfirm={() => {
      setParents((prevParents) =>
        prevParents.filter(
          (parent) => parent.id !== parentToDelete.id
        )
      );

      setParentToDelete(null);
    }}
  />
)}



        {showModal && (
            <ParentModal
                 editingParent={editingParent}
                onClose={() => { 
                    setShowModal(false);
                    setEditingParent(null)
                }}
                onAddParent={(parentData) => {
  if (editingParent) {
    setParents((prevParents) =>
      prevParents.map((parent) =>
        parent.id === editingParent.id
          ? {
              ...parentData,
              id: editingParent.id,
              children: parent.children,
            }
          : parent
      )
    );

    setEditingParent(null);
    setShowModal(false);
  } else {
    setParents((prevParents) => [
      ...prevParents,
      {
        ...parentData,
        id:
          prevParents.length > 0
            ? Math.max(
                ...prevParents.map((parent) => parent.id)
              ) + 1
            : 1,
        children: [],
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

export default Parents