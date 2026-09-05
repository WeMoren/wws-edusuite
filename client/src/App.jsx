import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing/LandingPage";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import DashboardLayout from "./layouts/DashboardLayout";
import Students from "./pages/dashboard/Students";
import Teachers from "./pages/dashboard/Teachers";
import Parents from "./pages/dashboard/Parents";
import Accountant from "./pages/dashboard/Accountant";
import Library from "./pages/dashboard/Library";
import Reception from "./pages/dashboard/Reception";
import Settings from "./pages/dashboard/Settings";
import Classes from "./pages/dashboard/Classes";
import Attendance from "./pages/dashboard/attendance/Attendance";
import Sections from "./pages/dashboard/Sections";
import AcademicSetup from "./pages/dashboard/AcademicSetup";
import Events from "./pages/dashboard/Events";
import Results from "./pages/dashboard/Results";
import ProtectedRoute from "./auth/ProtectedRoute";
import RoleRoute from "./auth/RoleRoute";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />

      {/* Login protection */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>

          <Route index element={<Dashboard />} />

          <Route path="students" element={<Students />} />

          <Route path="teachers" element={<Teachers />} />

          <Route path="classes" element={<Classes />} />

          <Route path="sections" element={<Sections />} />

            <Route
              path="academic-setup"
              element={
                <RoleRoute allowedRoles={["admin"]}>
                  <AcademicSetup />
                </RoleRoute>
              }
            />
          
          <Route path="attendance" element={<Attendance />} />

          <Route path="results" element={<Results />} />

          <Route path="events" element={<Events />} />

          {/* Admin only */}
            <Route
              path="parents"
              element={
                <RoleRoute allowedRoles={["admin"]}>
                  <Parents />
                </RoleRoute>
              }
            />

          <Route path="accountant" element={<Accountant />} />

          <Route path="library" element={<Library />} />

          <Route path="reception" element={<Reception />} />

          {/* Admin only */}
          <Route
            path="settings"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <Settings />
              </RoleRoute>
            }
          />

        </Route>
      </Route>
    </Routes>
  );
};

export default App;