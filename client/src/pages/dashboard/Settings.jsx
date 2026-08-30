import React, { useEffect, useState } from "react";
import "./Settings.css";

const Settings = () => {
  const [schoolProfile, setSchoolProfile] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo: "",
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem("schoolProfile");

    if (savedProfile) {
      setSchoolProfile(JSON.parse(savedProfile));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setSchoolProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = () => {
    localStorage.setItem(
      "schoolProfile",
      JSON.stringify(schoolProfile)
    );
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <p>Manage your school information and system settings.</p>

      <section className="school-profile">
        <h2>School Profile</h2>

        <p>
          Enter the information that will appear on school documents
          and student results.
        </p>

        <div className="school-profile__form">
          <div>
            <label htmlFor="schoolName">School Name</label>
            <input
              id="schoolName"
              name="name"
              type="text"
              value={schoolProfile.name}
              onChange={handleChange}
              placeholder="Enter school name"
            />
          </div>

          <div>
            <label htmlFor="schoolAddress">Address</label>
            <input
              id="schoolAddress"
              name="address"
              type="text"
              value={schoolProfile.address}
              onChange={handleChange}
              placeholder="Enter school address"
            />
          </div>

          <div>
            <label htmlFor="schoolPhone">Phone</label>
            <input
              id="schoolPhone"
              name="phone"
              type="tel"
              value={schoolProfile.phone}
              onChange={handleChange}
              placeholder="Enter school phone"
            />
          </div>

          <div>
            <label htmlFor="schoolEmail">Email</label>
            <input
              id="schoolEmail"
              name="email"
              type="email"
              value={schoolProfile.email}
              onChange={handleChange}
              placeholder="Enter school email"
            />
          </div>

          <div>
            <label htmlFor="schoolWebsite">Website</label>
            <input
              id="schoolWebsite"
              name="website"
              type="text"
              value={schoolProfile.website}
              onChange={handleChange}
              placeholder="Enter school website"
            />
          </div>

          <div>

            
            <label htmlFor="schoolLogo">School Logo</label>

            <input
              id="schoolLogo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];

                if (!file) {
                  return;
                }

                const reader = new FileReader();

                reader.onloadend = () => {
                  setSchoolProfile((prev) => ({
                    ...prev,
                    logo: reader.result,
                  }));
                };

                reader.readAsDataURL(file);
              }}
            />
          </div>
        </div>


        {schoolProfile.logo && (
          <div className="school-profile__logo-preview">
          <p>Logo Preview</p>

          <img
            src={schoolProfile.logo}
            alt="School logo preview"
          />
         </div>
        )} 
        <button type="button" onClick={handleSaveProfile}>
          Save School Profile
        </button>
      </section>
    </div>
  );
};

export default Settings;