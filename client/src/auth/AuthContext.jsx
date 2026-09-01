import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

const initialUsers = [
  {
    id: 1,
    firstName: "Johnson",
    lastName: "Smith",
    username: "admin",
    password: "admin123",
    role: "admin",
  },
  {
    id: 2,
    firstName: "John",
    lastName: "Doe",
    username: "teacher",
    password: "teacher123",
    role: "teacher",
  },
  {
    id: 3,
    firstName: "Sarah",
    lastName: "Williams",
    username: "accountant",
    password: "accountant123",
    role: "accountant",
  },
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (username, password) => {
    const user = initialUsers.find(
      (user) =>
        user.username === username &&
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