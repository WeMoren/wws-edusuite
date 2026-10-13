import React, {
createContext,
useContext,
useState,
} from "react";

const AuthContext = createContext();

const API_BASE_URL = "http://localhost:5000/api";


const normalizeRole = (role) => {
  const roleMap = {
    Principal: "Principal",
    "School Admin": "School Admin",
    Admin: "School Admin",
    Teacher: "Head Teacher",
    "Head Teacher": "Head Teacher",
    Accountant: "Accountant",
    "Exam Officer": "Exam Officer",
    principal: "Principal",
    school_admin: "School Admin",
    head_teacher: "Head Teacher",
    accountant: "Accountant",
    exam_officer: "Exam Officer",
    teacher: "Head Teacher",
    admin: "School Admin",
  };

  return roleMap[role] || role;
};

const normalizeUser = (user) => {
  const roles = [
    ...new Set(
      (Array.isArray(user.roles) && user.roles.length > 0
        ? user.roles
        : user.role
          ? [user.role]
          : []
      ).map(normalizeRole)
    ),
  ];

  const rolePriority = [
    "Principal",
    "School Admin",
    "Exam Officer",
    "Head Teacher",
    "Accountant",
  ];

  const primaryRole =
    rolePriority.find((role) => roles.includes(role)) || roles[0] || null;

  return {
    ...user,
    roles,
    role: primaryRole,
  };
};

export const AuthProvider = ({ children }) => {
const [currentUser, setCurrentUser] = useState(() => {
const savedUser = localStorage.getItem("currentUser");

if (!savedUser) {
  return null;
}

const normalizedUser = normalizeUser(JSON.parse(savedUser));

localStorage.setItem(
  "currentUser",
  JSON.stringify(normalizedUser)
);

return normalizedUser;
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

  const normalizedUser = normalizeUser(data.user);

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
