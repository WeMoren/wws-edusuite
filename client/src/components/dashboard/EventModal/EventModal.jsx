
import React, { useState } from "react";
import "./EventModal.css";

const EventModal = ({ onClose, onAddEvent, eventToEdit }) => {
    const [title, setTitle] = useState(eventToEdit ? eventToEdit.title : "");
    const [date, setDate] = useState(eventToEdit ? eventToEdit.date : "");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !date) {
            setError("Please provide an event title and date.");
            return;
        }

        setIsSaving(true);
        setError("");

        try {
            await onAddEvent({
                title: title.trim(),
                date,
            });

            onClose();
        } catch (error) {
            setError(
                error.message || "Failed to save the event. Please try again."
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="event-modal__overlay">
            <div className="event-modal">
                <div className="event-modal__header">
                    <h2>{eventToEdit ? "Edit Event" : "Add Event"}</h2>

                    <button
                        type="button"
                        className="event-modal__close"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="event-modal__field">
                        <label htmlFor="event-title">Event Title</label>

                        <input
                            id="event-title"
                            type="text"
                            placeholder="e.g. PTA Meeting"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={200}
                            required
                        />
                    </div>

                    <div className="event-modal__field">
                        <label htmlFor="event-date">Date</label>

                        <input
                            id="event-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <p className="event-modal__error" role="alert">
                            {error}
                        </p>
                    )}

                    <div className="event-modal__actions">
                        <button
                            type="button"
                            className="event-modal__cancel"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="event-modal__submit"
                            disabled={isSaving}
                        >
                            {isSaving
                                ? "Saving..."
                                : eventToEdit
                                    ? "Update Event"
                                    : "Add Event"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;
