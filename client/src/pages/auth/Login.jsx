
import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./Login.css";

const Login = () => {
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");

    const success = login(email, password);

    if (!success) {
      setError("Invalid email or password.");
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <h1>WWS-EduSuite</h1>
          <p>Welcome back</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form__group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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

          <p className="login-register">
            Don't have a school account?{" "}
            <Link className="register" to="/register">Register your school</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
