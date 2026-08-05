import { Routes, Route} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import DashboardLayout from "./layouts/DashboardLayout";
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />}/>
      <Route path="/login" element={<Login />}/>
      <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard/>} />
      </Route>
    </Routes>
  );
}

export default App;