import React from 'react'
import "./ActionButton.css"
import { Link } from 'react-router-dom'
const ActionButton = ({label, path, icon}) => {
  return (
        <Link to={path} className="action-button">
            <span className="action-button__icon">{icon}</span>
            <span className="action-button__label">{label}</span>
        </Link>
  )
}

export default ActionButton