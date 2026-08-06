import React from 'react'

const Header = () => {
  return (
    <header className='header'>
        <div className="header__logo">
            <h2>WWS EduSuit</h2>
        </div>

        <div className="header__actions">
            <button>🔔</button>
        

            <div className="header__profile">
                <span>Admin</span>
            </div>
        </div>
    </header>
  )
}

export default Header