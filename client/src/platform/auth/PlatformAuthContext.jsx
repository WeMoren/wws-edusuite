import React, { createContext, useContext, useState } from "react";

const PlatformAuthContext = createContext();

const developerUser = {
  id: "dev-001",
  firstName: "WWS",
  lastName: "Developer",
  email: "developer@wwsedusuite.com",
  role: "developer",
};

export const PlatformAuthProvider = ({ children }) => {
  const [developer, setDeveloper] = useState(() => {
    const savedDeveloper = localStorage.getItem("platformDeveloper");

    return savedDeveloper
      ? JSON.parse(savedDeveloper)
      : null;
  });

  const login = (email, password) => {
    if (
      email === "developer@wwsedusuite.com" &&
      password === "Developer@1234"
    ) {
      setDeveloper(developerUser);

      localStorage.setItem(
        "platformDeveloper",
        JSON.stringify(developerUser)
      );

      return true;
    }

    return false;
  };

  const logout = () => {
    setDeveloper(null);
    localStorage.removeItem("platformDeveloper");
  };

  return (
    <PlatformAuthContext.Provider
      value={{
        developer,
        login,
        logout,
      }}
    >
      {children}
    </PlatformAuthContext.Provider>
  );
};

export const usePlatformAuth = () => {
  return useContext(PlatformAuthContext);
};

export default PlatformAuthContext;
