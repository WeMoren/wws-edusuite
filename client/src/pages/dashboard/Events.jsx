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

    const {
        upcomingEvents,
        setUpcomingEvents,
    } = useOutletContext();

    return (
        <div className="events-page">
            <div className="events-page__header">
                <div>
                    <h1>Events</h1>
                    <p>Manage school events and activities.</p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowEventModal(true)}
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
                    onAddEvent={(eventData) => {
                        setUpcomingEvents((prevEvents) => {
                            if (editingEvent) {
                                return prevEvents.map((event) =>
                                    event.id === editingEvent.id
                                        ? eventData
                                        : event
                                );
                            }

                            return [
                                ...prevEvents,
                                {
                                    ...eventData,
                                    id:
                                        prevEvents.length > 0
                                            ? Math.max(
                                                ...prevEvents.map(
                                                    (event) => event.id
                                                )
                                            ) + 1
                                            : 1,
                                },
                            ];
                        });

                        setShowEventModal(false);
                        setEditingEvent(null);
                    }}
                />
            )}



            {deletingEvent && (
             <ConfirmDialog
                title="Delete Event"
                message={`Are you sure you want to delete "${deletingEvent.title}"?`}
                onCancel={() => setDeletingEvent(null)}
                onConfirm={() => {
                    setUpcomingEvents((prevEvents) =>
                        prevEvents.filter(
                            (event) => event.id !== deletingEvent.id
                        )
                    );

                    setDeletingEvent(null);
                    }}
             />
    )}
        </div>
    );
};

export default Events;