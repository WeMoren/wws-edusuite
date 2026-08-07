import React from 'react'
import "./ActivityItem.css"
export const ActivityItem = ({activity, time}) => {
  return (
    <div className='activity-item'>
        <h4 className="activity-item__title">{activity}</h4>
        <p className="activity-item__time">{time}</p>
    </div>
  )
}

export default ActivityItem