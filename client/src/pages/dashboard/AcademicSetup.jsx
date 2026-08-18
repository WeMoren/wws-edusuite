import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import academicLevels from "../../data/academicLevels";
import NotificationDialog from "../../components/common/NotificationDialog/NotificationDialog";
import "./AcademicSetup.css";

const AcademicSetup = () => {

    const [showNotification, setShowNotification] = useState(false);

    const handleSave = () => {
        setActiveAcademicLevels(selectedLevels);
        setShowNotification(true);
    };

    const {
        activeAcademicLevels,
        setActiveAcademicLevels
    } = useOutletContext();


    const [selectedLevels, setSelectedLevels] = useState(
        activeAcademicLevels
    );


    useEffect(() => {
        setSelectedLevels(activeAcademicLevels);
    }, [activeAcademicLevels]);


    const handleToggle = (levelId) => {

        setSelectedLevels((prevLevels) => {

            if (prevLevels.includes(levelId)) {

                return prevLevels.filter(
                    (id) => id !== levelId
                );

            }

            return [...prevLevels, levelId];
        });
    };


    

    return (
        <div className="academic-setup-page">

            <div className="academic-setup-page__header">

                <div>
                    <h1>Academic Setup</h1>

                    <p>
                        Select the academic levels
                        offered by your school.
                    </p>
                </div>

                <button
                    className="academic-setup-page__save"
                    onClick={handleSave}
                >
                    Save Academic Setup
                </button>

            </div>


            <div className="academic-setup">

                {[
                    "Early Years",
                    "Kindergarten",
                    "Primary",
                    "Junior Secondary",
                    "Senior Secondary"
                ].map((category) => {

                    const categoryLevels =
                        academicLevels.filter(
                            (level) =>
                                level.category === category
                        );


                    return (
                        <section
                            key={category}
                            className="academic-setup__category"
                        >

                            <h2>{category}</h2>


                            <div className="academic-setup__levels">

                                {categoryLevels.map(
                                    (level) => (

                                        <label
                                            key={level.id}
                                            className="academic-setup__level"
                                        >

                                            <input
                                                type="checkbox"
                                                checked={selectedLevels.includes(
                                                    level.id
                                                )}
                                                onChange={() =>
                                                    handleToggle(
                                                        level.id
                                                    )
                                                }
                                            />

                                            <span>
                                                {level.name}
                                            </span>

                                        </label>

                                    )
                                )}

                            </div>

                        </section>
                    );

                })}

            </div>

            {showNotification && (
                <NotificationDialog
                    title="Academic Setup Saved"
                    message="Your academic level configuration has been saved successfully."
                    onClose={() => setShowNotification(false)}
            />
)}
   
        </div>
    );
};

export default AcademicSetup;