import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

const initialUsers = [
  {
    id: 1,
    firstName: "Johnson",
    lastName: "Smith",
    username: "admin",
    email:"admin@wwstestschool.com",
    password: "Admin@1234",
    role: "admin",
  },
  {
    id: 2,
    firstName: "John",
    lastName: "Doe",
    username: "teacher",
    email: "teacher@wwstestschool.com",
    password: "teacher123",
    role: "teacher",
  },
  {
    id: 3,
    firstName: "Sarah",
    lastName: "Williams",
    username: "accountant",
    email: "accountant@wwstestschool.com",
    password: "accountant123",
    role: "accountant",
  },
  {
  id: 4,
  firstName: "Michael",
  lastName: "Brown",
  username: "examofficer",
  email: "examofficer@wwstestschool.com",
  password: "exam123",
  role: "examOfficer",
},
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (email, password) => {
    const user = initialUsers.find(
      (user) =>
        user.email === email &&
        user.password === password
    );

    if (!user) {
      return false;
    }

    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));

    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
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