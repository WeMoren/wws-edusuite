import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";


import NotificationDialog from "../../components/common/NotificationDialog/NotificationDialog";
import "./AcademicSetup.css";

const AcademicSetup = () => {

    const [showNotification, setShowNotification] = useState(false);

    const handleSave = () => {
        setActiveAcademicLevels(selectedLevels);
        setShowNotification(true);
    };

    const {
        academicLevels,
        setAcademicLevels,
        activeAcademicLevels,
        setActiveAcademicLevels,
        academicSessions,
        setAcademicSessions,
       
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

                <div className="academic-levels__form">
    <h2>Add Academic Level</h2>

    <input
        type="text"
        id="newLevelName"
        placeholder="e.g. Primary 6"
    />

    <select id="newLevelCategory">
        <option value="">
            Select category
        </option>

        <option value="Early Years">
            Early Years
        </option>

        <option value="Kindergarten">
            Kindergarten
        </option>

        <option value="Primary">
            Primary
        </option>

        <option value="Junior Secondary">
            Junior Secondary
        </option>

        <option value="Senior Secondary">
            Senior Secondary
        </option>
    </select>

    <button
        type="button"
        onClick={() => {
            const nameInput =
                document.getElementById("newLevelName");

            const categoryInput =
                document.getElementById("newLevelCategory");

            const name = nameInput.value.trim();
            const category = categoryInput.value;

            if (!name || !category) return;

            setAcademicLevels((prevLevels) => [
                ...prevLevels,
                {
                    id:
                        prevLevels.length > 0
                            ? Math.max(
                                ...prevLevels.map(
                                    (level) => level.id
                                )
                            ) + 1
                            : 1,
                    name,
                    category
                }
            ]);

            nameInput.value = "";
            categoryInput.value = "";
        }}
    >
        + Add Level
    </button>
</div>


                <div className="academic-sessions">
                <h2>Academic Sessions</h2>

        <div className="academic-sessions__form">
            <input
                type="text"
                placeholder="e.g. 2026/2027"
                id="newSession"
            />

            <button
                type="button"
                onClick={() => {
                    const input =
                        document.getElementById("newSession");

                    const sessionName =
                        input.value.trim();

                    if (!sessionName) return;

                    setAcademicSessions((prevSessions) => [
                        ...prevSessions,
                        {
                            id:
                                prevSessions.length > 0
                                    ? Math.max(
                                        ...prevSessions.map(
                                        (session) => session.id
                                    )
                                ) + 1
                                : 1,
                        name: sessionName
                    }
                ]);

                input.value = "";
            }}
        >
            + Add Session
        </button>
    </div>

    <div className="academic-sessions__list">
        {academicSessions.map((session) => (
            <div
                key={session.id}
                className="academic-sessions__item"
            >
                <span>{session.name}</span>

                <div className="academic-sessions__actions">
                    <button
                        type="button"
                        onClick={() => {
                            const newName = window.prompt(
                                "Enter the new session name:",
                                session.name
                            );

                            if (!newName?.trim()) return;

                            setAcademicSessions((prevSessions) =>
                                prevSessions.map((item) =>
                                    item.id === session.id
                                        ? {
                                            ...item,
                                            name: newName.trim()
                                        }
                                        : item
                                )
                            );
                        }}
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            const confirmed = window.confirm(
                                `Delete ${session.name}?`
                            );

                            if (!confirmed) return;

                            setAcademicSessions((prevSessions) =>
                                prevSessions.filter(
                                    (item) => item.id !== session.id
                                )
                            );
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        ))}
    </div>
</div>

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

                                        <div
    key={level.id}
    className="academic-setup__level"
>
    <label>
        <input
            type="checkbox"
            checked={selectedLevels.includes(
                level.id
            )}
            onChange={() =>
                handleToggle(level.id)
            }
        />

        <span>
            {level.name}
        </span>
    </label>

    <div className="academic-level__actions">
        <button
            type="button"
            onClick={() => {
                const newName = window.prompt(
                    "Enter the new level name:",
                    level.name
                );

                if (!newName?.trim()) return;

                setAcademicLevels((prevLevels) =>
                    prevLevels.map((item) =>
                        item.id === level.id
                            ? {
                                ...item,
                                name: newName.trim()
                            }
                            : item
                    )
                );
            }}
        >
            Edit
        </button>

        <button
            type="button"
            onClick={() => {
                const confirmed = window.confirm(
                    `Delete ${level.name}?`
                );

                if (!confirmed) return;

                setAcademicLevels((prevLevels) =>
                    prevLevels.filter(
                        (item) => item.id !== level.id
                    )
                );

                setActiveAcademicLevels((prevLevels) =>
                    prevLevels.filter(
                        (id) => id !== level.id
                    )
                );
            }}
        >
            Delete
        </button>
    </div>
</div>

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