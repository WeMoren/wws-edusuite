import React, { useState } from "react";
import "./EventModal.css";

const EventModal = ({ onClose, onAddEvent, eventToEdit }) => {
  const [title, setTitle] = useState(eventToEdit ? eventToEdit.title : "");
  const [date, setDate] = useState(eventToEdit ? eventToEdit.date : "");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim() || !date) {
      return;
    }

    onAddEvent({
      ...(eventToEdit && { id: eventToEdit.id }),
      title: title.trim(),
      date,
    });

    onClose();
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
            />
          </div>

          <div className="event-modal__field">
            <label htmlFor="event-date">Date</label>

            <input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="event-modal__actions">
            <button
              type="button"
              className="event-modal__cancel"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="event-modal__submit"
            >
              {eventToEdit ? "Update Event" : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;