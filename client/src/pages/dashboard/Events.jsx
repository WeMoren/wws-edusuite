
import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import "./Events.css";
import EventItem from "../../components/dashboard/EventItem/EventItem";
import EventModal from "../../components/dashboard/EventModal/EventModal";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";

const Events = () => {
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [deletingEvent, setDeletingEvent] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const {
        upcomingEvents,
        createEvent,
        updateEvent,
        deleteEvent,
    } = useOutletContext();

    const handleSaveEvent = async (eventData) => {
        if (editingEvent) {
            await updateEvent(editingEvent.id, eventData);
            return;
        }

        await createEvent(eventData);
    };

    const handleDeleteEvent = async () => {
        if (!deletingEvent) {
            return;
        }

        setIsDeleting(true);
        setDeleteError("");

        try {
            await deleteEvent(deletingEvent.id);
            setDeletingEvent(null);
        } catch (error) {
            setDeleteError(
                error.message || "Failed to delete the event. Please try again."
            );
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="events-page">
            <div className="events-page__header">
                <div>
                    <h1>Events</h1>
                    <p>Manage school events and activities.</p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setEditingEvent(null);
                        setShowEventModal(true);
                    }}
                >
                    + Add Event
                </button>
            </div>

            <section className="events-page__list">
                <h2>Upcoming Events</h2>

                {upcomingEvents.length > 0 ? (
                    <div className="events-page__items">
                        {upcomingEvents.map((event) => (
                            <div
                                className="events-page__item"
                                key={event.id}
                            >
                                <EventItem
                                    title={event.title}
                                    date={event.date}
                                />

                                <div className="events-page__actions">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingEvent(event);
                                            setShowEventModal(true);
                                        }}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDeleteError("");
                                            setDeletingEvent(event);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No events found.</p>
                )}
            </section>

            {showEventModal && (
                <EventModal
                    eventToEdit={editingEvent}
                    onClose={() => {
                        setShowEventModal(false);
                        setEditingEvent(null);
                    }}
                    onAddEvent={handleSaveEvent}
                />
            )}

            {deletingEvent && (
                <ConfirmDialog
                    title="Delete Event"
                    message={
                        deleteError
                            ? `Deletion failed: ${deleteError}`
                            : `Are you sure you want to delete "${deletingEvent.title}"?`
                    }
                    onCancel={() => {
                        if (!isDeleting) {
                            setDeletingEvent(null);
                            setDeleteError("");
                        }
                    }}
                    onConfirm={handleDeleteEvent}
                    loading={isDeleting}
                />
            )}
        </div>
    );
};

export default Events;
