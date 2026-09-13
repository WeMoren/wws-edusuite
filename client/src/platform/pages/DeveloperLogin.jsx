import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { usePlatformAuth } from "../auth/PlatformAuthContext";
import "../styles/developer-login.css";


const DeveloperLogin = () => {
  const { developer, login } = usePlatformAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (developer) {
    return <Navigate to="/platform" replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");

    const success = login(email, password);

    if (!success) {
      setError("Invalid developer email or password.");
      return;
    }

    navigate("/platform");
  };

  return (
    <div className="platform-login-page">
      <div className="platform-login-card">
        <div className="platform-login-header">
          <h1>WWS-EduSuite</h1>
          <p>Developer Control Panel</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="developer-email">
              Developer Email
            </label>

            <input
              id="developer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter developer email"
              required
            />
          </div>

          <div>
            <label htmlFor="developer-password">
              Password
            </label>

            <input
              id="developer-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <p className="platform-login-error">
              {error}
            </p>
          )}

          <button type="submit">
            Developer Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeveloperLogin;
