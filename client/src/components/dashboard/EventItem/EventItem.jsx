import React from 'react'
import "./EventItem.css"

const EventItem = ({title, date}) => {
  return (
    <div className="event-item">
        <h4 className="event-item__title">{title}</h4>
        
        <p className="event-item__date">{date}</p>
    </div>
  )
}

export default EventItem