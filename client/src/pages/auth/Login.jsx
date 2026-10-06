import React, { useState } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./Login.css";

const Login = () => {
const { currentUser, login } = useAuth();
const navigate = useNavigate();

const location = useLocation();

const registrationSuccess =
  location.state?.registrationSuccess || "";

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);

if (currentUser) {
return <Navigate to="/dashboard" replace />;
}

const handleSubmit = async (e) => {
e.preventDefault();


setError("");
setIsSubmitting(true);

const result = await login(email, password);

if (!result.success) {
  setError(result.message);
  setIsSubmitting(false);
  return;
}

navigate("/dashboard");


};

return ( <div className="login-page"> <div className="login-card"> <div className="login-card__header"> <h1>WWS-EduSuite</h1> <p>Welcome back</p> </div>


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
          disabled={isSubmitting}
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
          disabled={isSubmitting}
        />
      </div>

      {registrationSuccess && (
        <p className="login-form__success">
          {registrationSuccess}
        </p>
      )}

      {error && (
        <p className="login-form__error">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="login-form__button"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Logging in..." : "Login"}
      </button>

      <p className="login-register">
        Don't have a school account?{" "}
        <Link className="register" to="/register">
          Register your school
        </Link>
      </p>
    </form>
  </div>
</div>


);
};

export default Login;
