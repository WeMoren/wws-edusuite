
import React, { useEffect, useState } from "react";
import "./Settings.css";
import NotificationDialog from "../../components/common/NotificationDialog/NotificationDialog";
import { useAuth } from "../../auth/AuthContext";

const Settings = () => {
  const { authToken } = useAuth();
  const API_BASE_URL = "http://localhost:5000/api";
  const [officialIds, setOfficialIds] = useState({});
  const [schoolProfile, setSchoolProfile] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo: "",
  });

  const [documentAuthorization, setDocumentAuthorization] = useState({
    principal: {
      name: "",
      title: "Principal",
      signature: "",
      stamp: "",
    },
    examOfficer: {
      name: "",
      title: "Exam Officer",
      signature: "",
      stamp: "",
    },
    accountingOfficer: {
      name: "",
      title: "Accounting Officer",
      signature: "",
      stamp: "",
    },
  });

  const [showNotification, setShowNotification] =
    useState(false);

  const [notification, setNotification] = useState({
    title: "",
    message: "",
  });

  const apiRequest = async (path, options = {}) => {
    if (!authToken) {
      throw new Error("Your session has expired. Please log in again.");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "The request could not be completed.");
    }

    return data;
  };

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;

    const loadSettings = async () => {
      try {
        const [profileData, officialsData] = await Promise.all([
          apiRequest("/school-profile"),
          apiRequest("/school-officials"),
        ]);

        if (cancelled) return;

        const profile = profileData.profile;
        if (profile) {
          setSchoolProfile({
            name: profile.name || "",
            address: profile.address || "",
            phone: profile.phone || "",
            email: profile.email || "",
            website: profile.website || "",
            logo: profile.logo_url || "",
          });
        }

        const defaults = {
          principal: { name: "", title: "Principal", signature: "", stamp: "" },
          examOfficer: { name: "", title: "Exam Officer", signature: "", stamp: "" },
          accountingOfficer: { name: "", title: "Accounting Officer", signature: "", stamp: "" },
        };
        const typeMap = {
          principal: "principal",
          exam_officer: "examOfficer",
          accounting_officer: "accountingOfficer",
        };
        const nextAuthorization = { ...defaults };
        const nextIds = {};

        for (const official of officialsData.officials || []) {
          const key = typeMap[official.official_type];
          if (!key) continue;

          nextAuthorization[key] = {
            name: official.name || "",
            title: official.title || defaults[key].title,
            signature: official.signature_url || "",
            stamp: official.stamp_url || "",
          };
          nextIds[key] = official.id;
        }

        setDocumentAuthorization(nextAuthorization);
        setOfficialIds(nextIds);
      } catch (error) {
        if (!cancelled) {
          setNotification({ title: "Settings Could Not Load", message: error.message });
          setShowNotification(true);
        }
      }
    };

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setSchoolProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOfficialChange = (
    official,
    field,
    value
  ) => {
    setDocumentAuthorization((prev) => ({
      ...prev,
      [official]: {
        ...prev[official],
        [field]: value,
      },
    }));
  };

  const handleAssetUpload = (
    official,
    assetType,
    file
  ) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setDocumentAuthorization((prev) => ({
        ...prev,
        [official]: {
          ...prev[official],
          [assetType]: reader.result,
        },
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    try {
      const data = await apiRequest("/school-profile", {
        method: "PUT",
        body: JSON.stringify({
          name: schoolProfile.name,
          email: schoolProfile.email,
          phone: schoolProfile.phone,
          address: schoolProfile.address,
          website: schoolProfile.website,
          ...(schoolProfile.logo ? { logoUrl: schoolProfile.logo } : {}),
        }),
      });

      const profile = data.profile;
      if (profile) {
        setSchoolProfile({
          name: profile.name || "",
          address: profile.address || "",
          phone: profile.phone || "",
          email: profile.email || "",
          website: profile.website || "",
          logo: profile.logo_url || "",
        });
      }

      setNotification({ title: "Profile Saved", message: data.message || "School profile has been saved successfully." });
    } catch (error) {
      setNotification({ title: "Profile Save Failed", message: error.message });
    }
    setShowNotification(true);
  };

  const handleSaveAuthorization = async () => {
    const typeMap = {
      principal: "principal",
      examOfficer: "exam_officer",
      accountingOfficer: "accounting_officer",
    };

    try {
      const nextIds = { ...officialIds };

      for (const [key, official] of Object.entries(documentAuthorization)) {
        const name = official.name.trim();
        const title = official.title.trim();
        if (!name || !title) continue;

        const payload = { officialType: typeMap[key], name, title };
        if (official.signature) payload.signatureUrl = official.signature;
        if (official.stamp) payload.stampUrl = official.stamp;

        const path = nextIds[key] ? `/school-officials/${nextIds[key]}` : "/school-officials";
        const data = await apiRequest(path, {
          method: nextIds[key] ? "PUT" : "POST",
          body: JSON.stringify(payload),
        });

        if (data.official?.id) nextIds[key] = data.official.id;
      }

      setOfficialIds(nextIds);
      setNotification({ title: "Authorization Saved", message: "Document authorization settings have been saved successfully." });
    } catch (error) {
      setNotification({ title: "Authorization Save Failed", message: error.message });
    }
    setShowNotification(true);
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <p>
        Manage your school information and system
        settings.
      </p>

      {/* --------------------------------
          School Profile
      -------------------------------- */}

      <section className="school-profile">
        <h2>School Profile</h2>

        <p>
          Enter the information that will appear on
          school documents and student results.
        </p>

        <div className="school-profile__form">
          <div>
            <label htmlFor="schoolName">
              School Name
            </label>

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
            <label htmlFor="schoolAddress">
              Address
            </label>

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
            <label htmlFor="schoolPhone">
              Phone
            </label>

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
            <label htmlFor="schoolEmail">
              Email
            </label>

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
            <label htmlFor="schoolWebsite">
              Website
            </label>

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
            <label htmlFor="schoolLogo">
              School Logo
            </label>

            <input
              id="schoolLogo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file =
                  e.target.files[0];

                if (!file) {
                  return;
                }

                const reader =
                  new FileReader();

                reader.onloadend = () => {
                  setSchoolProfile(
                    (prev) => ({
                      ...prev,
                      logo: reader.result,
                    })
                  );
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

        <button
          type="button"
          onClick={handleSaveProfile}
        >
          Save School Profile
        </button>
      </section>

      {/* --------------------------------
          Document Authorization
      -------------------------------- */}

      <section className="document-authorization">
        <h2>Document Authorization</h2>

        <p>
          Configure the officials whose names,
          signatures, and stamps may appear on
          school documents.
        </p>

        {/* Principal */}

        <div className="document-authorization__official">
          <h3>Principal</h3>

          <p>
            Used for student results and payment
            receipts.
          </p>

          <div className="school-profile__form">
            <div>
              <label htmlFor="principalName">
                Full Name
              </label>

              <input
                id="principalName"
                type="text"
                value={
                  documentAuthorization
                    .principal.name
                }
                onChange={(e) =>
                  handleOfficialChange(
                    "principal",
                    "name",
                    e.target.value
                  )
                }
                placeholder="Enter principal's name"
              />
            </div>

            <div>
              <label htmlFor="principalTitle">
                Title
              </label>

              <input
                id="principalTitle"
                type="text"
                value={
                  documentAuthorization
                    .principal.title
                }
                onChange={(e) =>
                  handleOfficialChange(
                    "principal",
                    "title",
                    e.target.value
                  )
                }
                placeholder="Enter official title"
              />
            </div>

            <div>
              <label htmlFor="principalSignature">
                Digital Signature
              </label>

              <input
                id="principalSignature"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleAssetUpload(
                    "principal",
                    "signature",
                    e.target.files[0]
                  )
                }
              />
            </div>

            <div>
              <label htmlFor="principalStamp">
                Digital Stamp
              </label>

              <input
                id="principalStamp"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleAssetUpload(
                    "principal",
                    "stamp",
                    e.target.files[0]
                  )
                }
              />
            </div>
          </div>

          {documentAuthorization.principal
            .signature && (
            <div className="document-authorization__preview">
              <p>Signature Preview</p>

              <img
                src={
                  documentAuthorization
                    .principal.signature
                }
                alt="Principal signature preview"
              />
            </div>
          )}

          {documentAuthorization.principal
            .stamp && (
            <div className="document-authorization__preview">
              <p>Stamp Preview</p>

              <img
                src={
                  documentAuthorization
                    .principal.stamp
                }
                alt="Principal stamp preview"
              />
            </div>
          )}
        </div>

        {/* Exam Officer */}

        <div className="document-authorization__official">
          <h3>Exam Officer</h3>

          <p>
            Used for student results.
            Digital signature and stamp are optional.
          </p>

          <div className="school-profile__form">
            <div>
              <label htmlFor="examOfficerName">
                Full Name
              </label>

              <input
                id="examOfficerName"
                type="text"
                value={
                  documentAuthorization
                    .examOfficer.name
                }
                onChange={(e) =>
                  handleOfficialChange(
                    "examOfficer",
                    "name",
                    e.target.value
                  )
                }
                placeholder="Enter exam officer's name"
              />
            </div>

            <div>
              <label htmlFor="examOfficerTitle">
                Title
              </label>

              <input
                id="examOfficerTitle"
                type="text"
                value={
                  documentAuthorization
                    .examOfficer.title
                }
                onChange={(e) =>
                  handleOfficialChange(
                    "examOfficer",
                    "title",
                    e.target.value
                  )
                }
                placeholder="Enter official title"
              />
            </div>

            <div>
              <label htmlFor="examOfficerSignature">
                Digital Signature
              </label>

              <input
                id="examOfficerSignature"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleAssetUpload(
                    "examOfficer",
                    "signature",
                    e.target.files[0]
                  )
                }
              />
            </div>

            <div>
              <label htmlFor="examOfficerStamp">
                Digital Stamp
              </label>

              <input
                id="examOfficerStamp"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleAssetUpload(
                    "examOfficer",
                    "stamp",
                    e.target.files[0]
                  )
                }
              />
            </div>
          </div>

          {documentAuthorization.examOfficer
            .signature && (
            <div className="document-authorization__preview">
              <p>Signature Preview</p>

              <img
                src={
                  documentAuthorization
                    .examOfficer.signature
                }
                alt="Exam Officer signature preview"
              />
            </div>
          )}

          {documentAuthorization.examOfficer
            .stamp && (
            <div className="document-authorization__preview">
              <p>Stamp Preview</p>

              <img
                src={
                  documentAuthorization
                    .examOfficer.stamp
                }
                alt="Exam Officer stamp preview"
              />
            </div>
          )}
        </div>

        {/* Accounting Officer */}

        <div className="document-authorization__official">
          <h3>Accounting Officer</h3>

          <p>
            Used for payment receipts.
            Digital signature and stamp are optional.
          </p>

          <div className="school-profile__form">
            <div>
              <label htmlFor="accountingOfficerName">
                Full Name
              </label>

              <input
                id="accountingOfficerName"
                type="text"
                value={
                  documentAuthorization
                    .accountingOfficer.name
                }
                onChange={(e) =>
                  handleOfficialChange(
                    "accountingOfficer",
                    "name",
                    e.target.value
                  )
                }
                placeholder="Enter accounting officer's name"
              />
            </div>

            <div>
              <label htmlFor="accountingOfficerTitle">
                Title
              </label>

              <input
                id="accountingOfficerTitle"
                type="text"
                value={
                  documentAuthorization
                    .accountingOfficer.title
                }
                onChange={(e) =>
                  handleOfficialChange(
                    "accountingOfficer",
                    "title",
                    e.target.value
                  )
                }
                placeholder="Enter official title"
              />
            </div>

            <div>
              <label htmlFor="accountingOfficerSignature">
                Digital Signature
              </label>

              <input
                id="accountingOfficerSignature"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleAssetUpload(
                    "accountingOfficer",
                    "signature",
                    e.target.files[0]
                  )
                }
              />
            </div>

            <div>
              <label htmlFor="accountingOfficerStamp">
                Digital Stamp
              </label>

              <input
                id="accountingOfficerStamp"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleAssetUpload(
                    "accountingOfficer",
                    "stamp",
                    e.target.files[0]
                  )
                }
              />
            </div>
          </div>

          {documentAuthorization.accountingOfficer
            .signature && (
            <div className="document-authorization__preview">
              <p>Signature Preview</p>

              <img
                src={
                  documentAuthorization
                    .accountingOfficer.signature
                }
                alt="Accounting Officer signature preview"
              />
            </div>
          )}

          {documentAuthorization.accountingOfficer
            .stamp && (
            <div className="document-authorization__preview">
              <p>Stamp Preview</p>

              <img
                src={
                  documentAuthorization
                    .accountingOfficer.stamp
                }
                alt="Accounting Officer stamp preview"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSaveAuthorization}
        >
          Save Document Authorization
        </button>
      </section>

      {showNotification && (
        <NotificationDialog
          title={notification.title}
          message={notification.message}
          onClose={() =>
            setShowNotification(false)
          }
        />
      )}
    </div>
  );
};

export default Settings;

