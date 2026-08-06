import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header/Header'
import Sidebar from '../components/layout/Sidebar/Sidebar'
import "../components/layout/Layout.css"
const DashboardLayout = () => {
  return (
    <>
        <Header/>
           
        <div className="dashboard-layout">

            <Sidebar/>

            <main className='dashboard-content'>
                 <Outlet/>
            </main>
        </div>
        
    </>
  )
}

export default DashboardLayout