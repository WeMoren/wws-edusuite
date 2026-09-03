import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./Login.css";
const Login = () => {
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");

    const success = login(username, password);

    if (!success) {
      setError("Invalid username or password.");
      return;
    }

    navigate("/dashboard");
  };

  return (
  <div className="login-page">
    <div className="login-card">
      <div className="login-card__header">
        <h1>WWS-EduSuite</h1>
        <p>Staff Login</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-form__group">
          <label htmlFor="username">Username</label>

          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
        </div>

        <div className="login-form__group">
          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        {error && (
          <p className="login-form__error">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="login-form__button"
        >
          Login
        </button>
      </form>
    </div>
  </div>
);
};

export default Login;