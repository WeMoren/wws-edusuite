
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    schoolName: "",
    schoolEmail: "",
    schoolPhone: "",
    schoolAddress: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    console.log("Registration data:", formData);
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-card__header">
          <h1>WWS-EduSuite</h1>
          <p>Register Your School</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="register-section">
            <h2>School Information</h2>

            <div className="register-form__group">
              <label htmlFor="schoolName">School Name</label>
              <input
                id="schoolName"
                name="schoolName"
                type="text"
                value={formData.schoolName}
                onChange={handleChange}
                placeholder="Enter your school name"
                required
              />
            </div>

            <div className="register-form__row">
              <div className="register-form__group">
                <label htmlFor="schoolEmail">School Email</label>
                <input
                  id="schoolEmail"
                  name="schoolEmail"
                  type="email"
                  value={formData.schoolEmail}
                  onChange={handleChange}
                  placeholder="Enter school email"
                  required
                />
              </div>

              <div className="register-form__group">
                <label htmlFor="schoolPhone">School Phone</label>
                <input
                  id="schoolPhone"
                  name="schoolPhone"
                  type="tel"
                  value={formData.schoolPhone}
                  onChange={handleChange}
                  placeholder="Enter school phone"
                  required
                />
              </div>
            </div>

            <div className="register-form__group">
              <label htmlFor="schoolAddress">School Address</label>
              <textarea
                id="schoolAddress"
                name="schoolAddress"
                value={formData.schoolAddress}
                onChange={handleChange}
                placeholder="Enter school address"
                rows="3"
                required
              />
            </div>
          </div>

          <div className="register-section">
            <h2>Administrator Account</h2>

            <div className="register-form__row">
              <div className="register-form__group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="register-form__group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="register-form__group">
              <label htmlFor="email">Administrator Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter administrator email"
                required
              />
            </div>

            <div className="register-form__row">
              <div className="register-form__group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                />
              </div>

              <div className="register-form__group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="register-form__error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="register-form__button"
          >
            Create School Account
          </button>

          <p className="register-login">
            Already have a school account?{" "}
            <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;

