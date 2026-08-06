import { Routes, Route} from "react-router-dom";
import Home from "./pages/Home";
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
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />}/>
      <Route path="/login" element={<Login />}/>
      <Route path="/dashboard" element={<DashboardLayout />}>
      <Route index element={<Dashboard/>} />
          <Route path="students" element={<Students />}/>
          <Route path="teachers" element={<Teachers />}/>
          <Route path="parents" element={<Parents />}/>
          <Route path="accountant" element={<Accountant />}/>
          <Route path="library" element={<Library />}/>
          <Route path="reception" element={<Reception />}/>
          <Route path="settings" element={<Settings />}/>
      </Route>
      
    </Routes>
  );
}

export default App;