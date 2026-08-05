import React from 'react'
import { Outlet } from 'react-router-dom'

const DashboardLayout = () => {
  return (
    <>
        <header>
            <h2>WWS EduSuite</h2>
        </header>

        <main>
            <Outlet/>
        </main>
    </>
  )
}

export default DashboardLayout