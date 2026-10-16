
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./auth/ProtectedRoute";
import RoleRoute from "./auth/RoleRoute";
import PlatformProtectedRoute from "./platform/auth/PlatformProtectedRoute";

const LandingPage = lazy(() => import("./pages/Landing/LandingPage"));
const Login = lazy(() => import("./pages/auth/Login"));
const AcceptInvitation = lazy(() => import("./pages/auth/AcceptInvitation"));
const Register = lazy(() => import("./pages/auth/register/Register"));

const StaffManagement = lazy(() => import("./pages/dashboard/StaffManagement"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const Students = lazy(() => import("./pages/dashboard/Students"));
const Teachers = lazy(() => import("./pages/dashboard/Teachers"));
const Parents = lazy(() => import("./pages/dashboard/Parents"));
const Accountant = lazy(() => import("./pages/dashboard/Accountant"));
const Library = lazy(() => import("./pages/dashboard/Library"));
const Reception = lazy(() => import("./pages/dashboard/Reception"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const Classes = lazy(() => import("./pages/dashboard/Classes"));
const Attendance = lazy(() => import("./pages/dashboard/attendance/Attendance"));
const Sections = lazy(() => import("./pages/dashboard/Sections"));
const AcademicSetup = lazy(() => import("./pages/dashboard/AcademicSetup"));
const Subscription = lazy(() => import("./pages/dashboard/subscription/Subscription"));
const Events = lazy(() => import("./pages/dashboard/Events"));
const Results = lazy(() => import("./pages/dashboard/Results"));

const DeveloperLogin = lazy(() => import("./platform/pages/DeveloperLogin"));
const DeveloperLayout = lazy(() => import("./platform/layouts/DeveloperLayout"));
const DeveloperOverview = lazy(() => import("./platform/pages/overview/DeveloperOverview"));
const DeveloperSchools = lazy(() => import("./platform/pages/schools/DeveloperSchools"));
const DeveloperSchoolDetails = lazy(() => import("./platform/pages/schools/DeveloperSchoolDetails"));
const DeveloperSchoolUsers = lazy(() => import("./platform/pages/schools/DeveloperSchoolUsers"));
const DeveloperSchoolSubscription = lazy(() => import("./platform/pages/schools/DeveloperSchoolSubscription"));
const DeveloperSubscriptions = lazy(() => import("./platform/pages/subscriptions/DeveloperSubscriptions"));
const DeveloperSchoolActivity = lazy(() => import("./platform/pages/schools/DeveloperSchoolActivity"));
const DeveloperUsers = lazy(() => import("./platform/pages/users/DeveloperUsers"));
const DeveloperActivity = lazy(() => import("./platform/pages/activity/DeveloperActivity"));
const DeveloperSystemHealth = lazy(() => import("./platform/pages/system-health/DeveloperSystemHealth"));
const DeveloperDevelopment = lazy(() => import("./platform/pages/development/DeveloperDevelopment"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));




const App = () => {
  return (
  <Suspense
    fallback={
      <div className="app-loading" role="status">
        Loading WWS EduSuite...
      </div>
    }
  >
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/accept-invitation"
        element={<AcceptInvitation />}
      />
      <Route
        path="/platform/login"
        element={<DeveloperLogin />}
      />

      {/* Developer platform routes */}
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

      {/* Protected school dashboard routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />

          <Route
            path="students"
            element={
              <RoleRoute
                allowedRoles={[
                  "Principal",
                  "Exam Officer",
                  "Head Teacher",
                ]}
              >
                <Students />
              </RoleRoute>
            }
          />

          <Route
            path="teachers"
            element={
              <RoleRoute
                allowedRoles={[
                  "Principal",
                  "Exam Officer",
                  "Head Teacher",
                ]}
              >
                <Teachers />
              </RoleRoute>
            }
          />

          <Route
            path="classes"
            element={
              <RoleRoute
                allowedRoles={[
                  "Principal",
                  "Exam Officer",
                  "Head Teacher",
                ]}
              >
                <Classes />
              </RoleRoute>
            }
          />

          <Route
            path="sections"
            element={
              <RoleRoute
                allowedRoles={[
                  "Principal",
                  "Exam Officer",
                  "Head Teacher",
                ]}
              >
                <Sections />
              </RoleRoute>
            }
          />

          <Route
            path="academic-setup"
            element={
              <RoleRoute
                allowedRoles={["Principal", "School Admin"]}
              >
                <AcademicSetup />
              </RoleRoute>
            }
          />

          <Route
            path="attendance"
            element={
              <RoleRoute
                allowedRoles={[
                  "Principal",
                  "Head Teacher",
                  "Exam Officer",
                ]}
              >
                <Attendance />
              </RoleRoute>
            }
          />

          <Route
            path="results"
            element={
              <RoleRoute
                allowedRoles={["Principal", "Exam Officer"]}
              >
                <Results />
              </RoleRoute>
            }
          />

          <Route
            path="events"
            element={
              <RoleRoute
                allowedRoles={["Principal", "Head Teacher"]}
              >
                <Events />
              </RoleRoute>
            }
          />

          {/* Parent management */}
          <Route
            path="parents"
            element={
              <RoleRoute allowedRoles={["Principal"]}>
                <Parents />
              </RoleRoute>
            }
          />

          {/* Accountant access */}
          <Route
            path="accountant"
            element={
              <RoleRoute allowedRoles={["Principal", "Accountant"]}>
                <Accountant />
              </RoleRoute>
            }
          />

          <Route
            path="library"
            element={
              <RoleRoute
                allowedRoles={["Principal", "Head Teacher"]}
              >
                <Library />
              </RoleRoute>
            }
          />

          <Route
            path="reception"
            element={
              <RoleRoute allowedRoles={["Principal"]}>
                <Reception />
              </RoleRoute>
            }
          />

          <Route
            path="staff"
            element={
            <RoleRoute allowedRoles={["Principal"]}>
                <StaffManagement />
              </RoleRoute>
            }
          />

          {/* School settings */}
          <Route
            path="settings"
            element={
              <RoleRoute
                allowedRoles={["Principal", "School Admin"]}
              >
                <Settings />
              </RoleRoute>
            }
          />

          {/* Subscription and payment callback */}
          <Route
            path="subscription/callback"
            element={
              <RoleRoute
                allowedRoles={["Principal", "School Admin"]}
              >
                <Subscription />
              </RoleRoute>
            }
          />

          <Route
            path="subscription"
            element={
              <RoleRoute
                allowedRoles={["Principal", "School Admin"]}
              >
                <Subscription />
              </RoleRoute>
            }
          />
        </Route>
      </Route>
    </Routes>
  </Suspense>
);
};

export default App;