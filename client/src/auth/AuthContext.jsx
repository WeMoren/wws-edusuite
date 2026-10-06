import React, {
createContext,
useContext,
useState,
} from "react";

const AuthContext = createContext();

const API_BASE_URL = "http://localhost:5000/api";

const normalizeRole = (role) => {
  const roleMap = {
    Admin: "admin",
    Teacher: "teacher",
    Accountant: "accountant",
    "Exam Officer": "examOfficer",
  };

  return roleMap[role] || role;
};

export const AuthProvider = ({ children }) => {
const [currentUser, setCurrentUser] = useState(() => {
const savedUser = localStorage.getItem("currentUser");

return savedUser ? JSON.parse(savedUser) : null;
});

const [authToken, setAuthToken] = useState(() => {
return localStorage.getItem("authToken");
});

const login = async (email, password) => {
try {
const response = await fetch(`${API_BASE_URL}/auth/login`, {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
email,
password,
}),
});

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      message: data.message || "Login failed.",
    };
  }

  const normalizedUser = {
    ...data.user,
    role: normalizeRole(data.user.role),
};

  localStorage.setItem(
    "currentUser",
    JSON.stringify(normalizedUser)
  );

  localStorage.setItem("authToken", data.token);

  setCurrentUser(normalizedUser);
  setAuthToken(data.token);

  return {
    success: true,
    user: normalizedUser,
  };
} catch (error) {
  console.error("Login request failed:", error);

  return {
    success: false,
    message: "Unable to connect to the server.",
  };
}


};

const logout = () => {
setCurrentUser(null);
setAuthToken(null);


localStorage.removeItem("currentUser");
localStorage.removeItem("authToken");


};

return (
<AuthContext.Provider
value={{
currentUser,
authToken,
login,
logout,
}}
>
{children}
</AuthContext.Provider>
);
};

export const useAuth = () => {
return useContext(AuthContext);
};

export default AuthContext;
