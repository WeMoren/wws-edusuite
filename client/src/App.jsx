import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing/LandingPage";
import Login from "./pages/auth/Login";
import AcceptInvitation from "./pages/auth/AcceptInvitation";
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
import Subscription from "./pages/dashboard/subscription/Subscription";
import Events from "./pages/dashboard/Events";
import Results from "./pages/dashboard/Results";
import ProtectedRoute from "./auth/ProtectedRoute";
import RoleRoute from "./auth/RoleRoute";
import Register from "./pages/auth/register/Register";
import DeveloperLogin from "./platform/pages/DeveloperLogin";
import PlatformProtectedRoute from "./platform/auth/PlatformProtectedRoute";
import DeveloperLayout from "./platform/layouts/DeveloperLayout";
import DeveloperOverview from "./platform/pages/overview/DeveloperOverview";
import DeveloperSchools from "./platform/pages/schools/DeveloperSchools";
import DeveloperSchoolDetails from "./platform/pages/schools/DeveloperSchoolDetails";
import DeveloperSchoolUsers from "./platform/pages/schools/DeveloperSchoolUsers";
import DeveloperSchoolSubscription from "./platform/pages/schools/DeveloperSchoolSubscription";
import DeveloperSubscriptions from "./platform/pages/subscriptions/DeveloperSubscriptions";
import DeveloperSchoolActivity from "./platform/pages/schools/DeveloperSchoolActivity";
import DeveloperUsers from "./platform/pages/users/DeveloperUsers";
import DeveloperActivity from "./platform/pages/activity/DeveloperActivity";
import DeveloperSystemHealth from "./platform/pages/system-health/DeveloperSystemHealth";
import DeveloperDevelopment from "./platform/pages/development/DeveloperDevelopment";





const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />
      <Route path="/platform/login" element={<DeveloperLogin />} />
      <Route element={<PlatformProtectedRoute />}>
        <Route path="/platform" element={<DeveloperLayout />}>
          <Route index element={<DeveloperOverview />} />
              <Route
                path="schools"
                element={<DeveloperSchools />}
              />

              <Route
                path="schools/:schoolId"
                element={<DeveloperSchoolDetails />}
              />


              <Route
                  path="schools/:schoolId/users"
                  element={<DeveloperSchoolUsers />}
                />

              <Route
                path="schools/:schoolId/subscription"
                element={<DeveloperSchoolSubscription />}
              />


              <Route
                path="schools/:schoolId/activity"
                element={<DeveloperSchoolActivity />}
              />


             <Route
              path="users"
              element={<DeveloperUsers />}
            />

             <Route
              path="subscriptions"
              element={<DeveloperSubscriptions />}
            />

              <Route
                path="activity"
                element={<DeveloperActivity />}
              />

              <Route
                path="system-health"
                element={<DeveloperSystemHealth />}
              />

              <Route
                path="development"
                element={<DeveloperDevelopment />}
              />

        </Route>
    </Route>

      {/* Login protection */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>

          <Route index element={<Dashboard />} />

          <Route path="students" element={
              <RoleRoute allowedRoles={["Principal", "Exam Officer", "Head Teacher"]}>
                <Students />
              </RoleRoute>
            }
          />

          <Route path="teachers" element={
             <RoleRoute
                allowedRoles={["Principal", "Exam Officer", "Head Teacher"]}
              >
              <Teachers />
           </RoleRoute>
          }
        />

          <Route path="classes" element={
            <RoleRoute
                allowedRoles={["Principal", "Exam Officer", "Head Teacher"]}
              >
              <Classes />
           </RoleRoute>
           }
         />

          <Route path="sections" element={ <RoleRoute
              allowedRoles={["Principal", "Exam Officer", "Head Teacher"]}
            >
            <Sections />
         </RoleRoute>
      }
      />

            <Route
              path="academic-setup"
              element={
                <RoleRoute allowedRoles={["Principal", "School Admin"]}>
                  <AcademicSetup />
                </RoleRoute>
              }
            />

          <Route path="attendance" element={
             <RoleRoute
              allowedRoles={["Principal", "Head Teacher", "Exam Officer"]}
            >
              <Attendance />
            </RoleRoute>
           }
        />

          <Route path="results" element={
            <RoleRoute allowedRoles={["Principal", "Exam Officer"]}>
              <Results />
            </RoleRoute>
          }
         />

          <Route path="events" element={
            <RoleRoute allowedRoles={["Principal", "Head Teacher"]}>
              <Events />
          </RoleRoute>
           }
          />

          {/* Admin only */}
            <Route
              path="parents"
              element={
                <RoleRoute allowedRoles={["Principal"]}>
                  <Parents />
                </RoleRoute>
              }
            />

          <Route path="accountant" element={
             <RoleRoute allowedRoles={["Accountant"]}>
                <Accountant />
             </RoleRoute>
            }
           />

          <Route path="library" element={
            <RoleRoute allowedRoles={["Principal", "Head Teacher"]}>
               <Library />
            </RoleRoute>
            }
          />

          <Route path="reception" element={
              <RoleRoute allowedRoles={["Principal"]}>
                <Reception />
              </RoleRoute>
            }
           />

          {/* Admin only */}
          <Route
            path="settings"
            element={
              <RoleRoute allowedRoles={["Principal", "School Admin"]}>
                <Settings />
              </RoleRoute>
            }
          />

                   <Route
            path="subscription/callback"
            element={
              <RoleRoute allowedRoles={["Principal", "School Admin"]}>
                <Subscription />
              </RoleRoute>
            }
          />

          <Route
            path="subscription"
            element={
              <RoleRoute allowedRoles={["Principal", "School Admin"]}>
                <Subscription />
              </RoleRoute>
            }
          />

        </Route>
      </Route>
    </Routes>
  );
};

export default App;