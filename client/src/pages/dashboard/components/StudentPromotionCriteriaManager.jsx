import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { hasPermission } from "../../../auth/permissions";
import ConfirmDialog from "../../../components/common/ConfirmDialog/ConfirmDialog";
import "./StudentPromotionCriteriaManager.css";

const API_BASE_URL = "http://localhost:5000/api";

const createEmptyForm = (academicLevelId = "") => ({
  academicLevelId,
  minimumSessionAverage: "50",
  subjectPassMark: "40",
  minimumSubjectsPassed: "5",
  termDisplayOrders: [],
  subjectIds: [],
});

const StudentPromotionCriteriaManager = () => {
  const { authToken, currentUser } = useAuth();

  const roles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : currentUser?.role
      ? [currentUser.role]
      : [];

  const canView = roles.some((role) =>
    hasPermission(role, "studentPromotionCriteria", "view")
  );

  const canCreate = roles.some((role) =>
    hasPermission(role, "studentPromotionCriteria", "create")
  );

  const canEdit = roles.some((role) =>
    hasPermission(role, "studentPromotionCriteria", "edit")
  );

  const [configurations, setConfigurations] = useState([]);
  const [supportingData, setSupportingData] = useState({
    levels: [],
    subjects: [],
    combinations: [],
    commonSubjectIds: [],
    sessions: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [warning, setWarning] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCriteriaId, setEditingCriteriaId] = useState("");
  const [form, setForm] = useState(createEmptyForm());

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
      const detailMessage = Array.isArray(data.details?.missingTermCoverage)
        ? data.details.missingTermCoverage
            .map(
              (item) =>
                `${item.sessionName}: missing term order(s) ${item.missingTermOrders.join(", ")}`
            )
            .join("; ")
        : "";

      throw new Error(
        detailMessage
          ? `${data.message || "The request could not be completed."} ${detailMessage}`
          : data.message || "The request could not be completed."
      );
    }

    return data;
  };

  const loadManagerData = async () => {
    setLoading(true);
    setError("");

    try {
      const [configurationData, supportingDataResult] = await Promise.all([
        apiRequest("/student-promotion-criteria"),
        apiRequest("/student-promotion-criteria/supporting-data"),
      ]);

      setConfigurations(
        Array.isArray(configurationData) ? configurationData : []
      );

      setSupportingData({
        levels: supportingDataResult.levels || [],
        subjects: supportingDataResult.subjects || [],
         combinations: supportingDataResult.combinations || [],
        commonSubjectIds: supportingDataResult.commonSubjectIds || [],
        sessions: supportingDataResult.sessions || [],
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView && authToken) {
      loadManagerData();
    } else {
      setLoading(false);
    }
  }, [canView, authToken]);

  const availableSessions = useMemo(
    () =>
      supportingData.sessions.filter(
        (session) => Array.isArray(session.terms) && session.terms.length > 0
      ),
    [supportingData.sessions]
  );

  const availableTermOrders = useMemo(() => {
    if (availableSessions.length === 0) return [];

    const firstSessionOrders = availableSessions[0].terms.map((term) =>
      Number(term.display_order)
    );

    return firstSessionOrders.filter((order) =>
      availableSessions.every((session) =>
        session.terms.some(
          (term) => Number(term.display_order) === order
        )
      )
    );
  }, [availableSessions]);

  const availableSubjects = useMemo(() => {
    if (!form.academicLevelId) {
      return supportingData.subjects.filter((subject) =>
        supportingData.commonSubjectIds.includes(subject.id)
      );
    }

    return supportingData.subjects.filter((subject) =>
      subject.academic_levels?.some(
        (level) => level.id === form.academicLevelId
      )
    );
  }, [
    form.academicLevelId,
    supportingData.subjects,
    supportingData.commonSubjectIds,
  ]);

    const combinationValidation = useMemo(() => {
    const requiredLevels = supportingData.levels.filter(
      (level) =>
        level.requires_subject_combination &&
        (
          !form.academicLevelId ||
          level.id === form.academicLevelId
        )
    );

    if (requiredLevels.length === 0) {
      return {
        requiresCombinations: false,
        missingLevels: [],
        emptyIntersections: [],
        minimumApplicableSubjectCount: form.subjectIds.length,
        combinationCount: 0,
      };
    }

    const requiredLevelIds = requiredLevels.map(
      (level) => level.id
    );

    const applicableCombinations =
      supportingData.combinations.filter(
        (combination) =>
          requiredLevelIds.includes(
            combination.academic_level_id
          )
      );

    const levelsWithCombinations = [
      ...new Set(
        applicableCombinations.map(
          (combination) => combination.academic_level_id
        )
      ),
    ];

    const missingLevels = requiredLevels.filter(
      (level) =>
        !levelsWithCombinations.includes(level.id)
    );

    const evaluatedCombinations =
      applicableCombinations.map((combination) => {
        const applicableSubjectIds =
          form.subjectIds.filter((subjectId) =>
            combination.subject_ids.includes(subjectId)
          );

        return {
          ...combination,
          applicableSubjectCount: applicableSubjectIds.length,
        };
      });

    const emptyIntersections = evaluatedCombinations.filter(
      (combination) =>
        combination.applicableSubjectCount === 0
    );

    const minimumApplicableSubjectCount =
      evaluatedCombinations.length > 0
        ? Math.min(
            ...evaluatedCombinations.map(
              (combination) =>
                combination.applicableSubjectCount
            )
          )
        : 0;

    return {
      requiresCombinations: true,
      missingLevels,
      emptyIntersections,
      minimumApplicableSubjectCount,
      combinationCount: evaluatedCombinations.length,
    };
  }, [
    form.academicLevelId,
    form.subjectIds,
    supportingData.levels,
    supportingData.combinations,
  ]);

  const getTermLabel = (order) => {
    const term = availableSessions
      .flatMap((session) => session.terms)
      .find((item) => Number(item.display_order) === Number(order));

    return term?.name || `Term ${order}`;
  };

  const updateFormField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const toggleArrayValue = (field, value) => {
    setForm((previous) => {
      const currentValues = previous[field];

      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return {
        ...previous,
        [field]: nextValues,
      };
    });
  };

  const resetForm = () => {
    setForm(createEmptyForm());
    setShowCreateForm(false);
    setEditingCriteriaId("");
  };

  const startCreatingConfiguration = () => {
    setNotice("");
    setError("");
    setWarning(null);
    setEditingCriteriaId("");
    setForm(createEmptyForm());
    setShowCreateForm(true);
  };

  const startEditingDraft = (criteria) => {
    setNotice("");
    setError("");
    setWarning(null);

    setShowCreateForm(false);
    setEditingCriteriaId(criteria.id);

    setForm({
      academicLevelId: criteria.academic_level_id || "",
      minimumSessionAverage: String(
        criteria.draft_minimum_session_average ?? ""
      ),
      subjectPassMark: String(criteria.draft_subject_pass_mark ?? ""),
      minimumSubjectsPassed: String(
        criteria.draft_minimum_subjects_passed ?? ""
      ),
      termDisplayOrders: (
        criteria.draft_term_display_orders || []
      ).map(Number),
      subjectIds: criteria.draft_subject_ids || [],
    });
  };

  const validateForm = () => {
    if (
      form.minimumSessionAverage === "" ||
      form.subjectPassMark === "" ||
      form.minimumSubjectsPassed === ""
    ) {
      return "Complete all three promotion thresholds.";
    }

    const average = Number(form.minimumSessionAverage);
    const passMark = Number(form.subjectPassMark);
    const minimumSubjects = Number(form.minimumSubjectsPassed);

    if (
      !Number.isFinite(average) ||
      average < 0 ||
      average > 100
    ) {
      return "Minimum session average must be between 0 and 100.";
    }

    if (
      !Number.isFinite(passMark) ||
      passMark < 0 ||
      passMark > 100
    ) {
      return "Subject pass mark must be between 0 and 100.";
    }

    if (
      !Number.isInteger(minimumSubjects) ||
      minimumSubjects < 0
    ) {
      return "Minimum subjects passed must be a non-negative whole number.";
    }

    if (form.termDisplayOrders.length === 0) {
      return "Select at least one required term.";
    }

    if (form.subjectIds.length === 0) {
      return "Select at least one required subject.";
    }

        if (minimumSubjects > form.subjectIds.length) {
      return "Minimum subjects passed cannot exceed the selected subject count.";
    }

    if (combinationValidation.missingLevels.length > 0) {
      const levelNames = combinationValidation.missingLevels
        .map((level) => level.name)
        .join(", ");

      return `Configure at least one valid active subject combination for: ${levelNames}.`;
    }

    if (combinationValidation.emptyIntersections.length > 0) {
      const combinationNames =
        combinationValidation.emptyIntersections
          .map(
            (combination) =>
              `${combination.stream_name} – ${combination.name}`
          )
          .join(", ");

      return `Selected subjects have no overlap with these active combinations: ${combinationNames}.`;
    }

    if (
      combinationValidation.requiresCombinations &&
      minimumSubjects >
        combinationValidation.minimumApplicableSubjectCount
    ) {
      return `Minimum subjects passed cannot exceed ${combinationValidation.minimumApplicableSubjectCount}, the smallest applicable subject count across active combinations.`;
    }

    return "";
  };

  const getPayload = () => ({
    minimumSessionAverage: Number(form.minimumSessionAverage),
    subjectPassMark: Number(form.subjectPassMark),
    minimumSubjectsPassed: Number(form.minimumSubjectsPassed),
    termDisplayOrders: form.termDisplayOrders,
    subjectIds: form.subjectIds,
  });

  const handleCreateConfiguration = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await apiRequest("/student-promotion-criteria", {
        method: "POST",
        body: JSON.stringify({
          ...getPayload(),
          academicLevelId: form.academicLevelId || null,
        }),
      });

      resetForm();
      setNotice("Promotion criteria configuration created as a draft.");
      await loadManagerData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDraft = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const criteria = configurations.find(
      (item) => item.id === editingCriteriaId
    );

    if (!criteria?.draft_version_id) {
      setError("The editable draft could not be found. Refresh and try again.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await apiRequest(
        `/student-promotion-criteria/${criteria.id}/versions/${criteria.draft_version_id}`,
        {
          method: "PUT",
          body: JSON.stringify(getPayload()),
        }
      );

      resetForm();
      setNotice("Promotion criteria draft updated successfully.");
      await loadManagerData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateVersion = async (criteria) => {
  setSaving(true);
  setError("");
  setNotice("");

  try {
    await apiRequest(
      `/student-promotion-criteria/${criteria.id}/versions`,
      {
        method: "POST",
      }
    );

    setNotice("A new draft version has been created.");
    await loadManagerData();
  } catch (requestError) {
    setError(requestError.message);
  } finally {
    setSaving(false);
  }
};

const handleSealVersion = async (criteria) => {
  if (!criteria.draft_version_id) return;

  setSaving(true);
  setError("");
  setNotice("");

  try {
    await apiRequest(
      `/student-promotion-criteria/${criteria.id}/versions/${criteria.draft_version_id}/seal`,
      {
        method: "POST",
      }
    );

    setNotice(
      `Version ${criteria.draft_version_number} sealed successfully. Remember: sealing does not activate the configuration.`
    );

    await loadManagerData();
  } catch (requestError) {
    setError(requestError.message);
  } finally {
    setSaving(false);
  }
};

const handleActivation = async (criteria) => {
  const nextActiveState = !criteria.is_active;

  setSaving(true);
  setError("");
  setNotice("");
  setWarning(null);

  try {
    const result = await apiRequest(
      `/student-promotion-criteria/${criteria.id}/activation`,
      {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextActiveState }),
      }
    );

    setWarning(result.warning || null);

    setNotice(
      nextActiveState
        ? "Promotion criteria configuration activated."
        : "Promotion criteria configuration deactivated."
    );

    await loadManagerData();
  } catch (requestError) {
    setError(requestError.message);
  } finally {
    setSaving(false);
  }
};


const openConfirmation = (action, criteria) => {
  const confirmationDetails = {
    createVersion: {
      title: "Create New Draft",
      message:
        "Create a new draft based on the latest sealed version of this configuration?",
      confirmLabel: "Create Draft",
      loadingLabel: "Creating...",
    },
    sealVersion: {
      title: "Seal Promotion Criteria",
      message: `Seal version ${criteria.draft_version_number}? Sealed versions are immutable and cannot be edited. Sealing will NOT activate this configuration.`,
      confirmLabel: "Seal Version",
      loadingLabel: "Sealing...",
    },
    activate: {
      title: "Activate Promotion Criteria",
      message: "Activate this promotion criteria configuration?",
      confirmLabel: "Activate",
      loadingLabel: "Activating...",
    },
    deactivate: {
      title: "Deactivate Promotion Criteria",
      message:
        "Deactivate this promotion criteria configuration? Progression evaluations may be blocked for affected academic levels if no active fallback exists.",
      confirmLabel: "Deactivate",
      loadingLabel: "Deactivating...",
      confirmClassName: "confirm-dialog__delete",
    },
  };

  setConfirmation({
    action,
    criteria,
    ...confirmationDetails[action],
  });
};

const handleConfirmAction = async () => {
  if (!confirmation || saving) return;

  try {
    if (confirmation.action === "createVersion") {
      await handleCreateVersion(confirmation.criteria);
    } else if (confirmation.action === "sealVersion") {
      await handleSealVersion(confirmation.criteria);
    } else if (
      confirmation.action === "activate" ||
      confirmation.action === "deactivate"
    ) {
      await handleActivation(confirmation.criteria);
    }
  } finally {
    setConfirmation(null);
  }
};

  if (!canView) return null;

  const renderCriteriaCard = (criteria) => {
    const isSchoolDefault = !criteria.academic_level_id;
    const hasDraft = Boolean(criteria.draft_version_id);
    const hasSealedVersion = Boolean(criteria.sealed_version_id);

    return (
      <article
        className="spcm-criteria-card"
        key={criteria.id}
      >
        <div className="spcm-card-top">
          <div>
            <span className="spcm-card-eyebrow">
              {isSchoolDefault ? "SCHOOL-WIDE CONFIGURATION" : "ACADEMIC LEVEL"}
            </span>

            <h3>
              {isSchoolDefault
                ? "School-wide default"
                : criteria.academic_level_name || "Academic level"}
            </h3>
          </div>

          <span
            className={`spcm-status ${
              criteria.is_active ? "spcm-status-active" : "spcm-status-inactive"
            }`}
          >
            {criteria.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="spcm-version-grid">
          <div className="spcm-version-box spcm-sealed-box">
            <div className="spcm-version-heading">
              <span>Latest sealed version</span>
              <span className="spcm-version-icon">✓</span>
            </div>

            {hasSealedVersion ? (
              <>
                <strong>Version {criteria.sealed_version_number}</strong>
                <p>
                  Average: {criteria.sealed_minimum_session_average}% · Pass
                  mark: {criteria.sealed_subject_pass_mark}%
                </p>
                <p>
                  Minimum subjects passed:{" "}
                  {criteria.sealed_minimum_subjects_passed}
                </p>
              </>
            ) : (
              <p className="spcm-empty-version">
                No sealed version yet
              </p>
            )}
          </div>

          <div className="spcm-version-box spcm-draft-box">
            <div className="spcm-version-heading">
              <span>Editable draft</span>
              <span className="spcm-version-icon">✎</span>
            </div>

            {hasDraft ? (
              <>
                <strong>Version {criteria.draft_version_number}</strong>
                <p>
                  Average: {criteria.draft_minimum_session_average}% · Pass
                  mark: {criteria.draft_subject_pass_mark}%
                </p>
                <p>
                  Minimum subjects passed:{" "}
                  {criteria.draft_minimum_subjects_passed}
                </p>
              </>
            ) : (
              <p className="spcm-empty-version">
                No unsealed draft
              </p>
            )}
          </div>
        </div>

        <div className="spcm-card-footer">
          <div className="spcm-card-note">
            {criteria.is_active && hasSealedVersion
              ? `Evaluations use sealed version ${criteria.sealed_version_number}.`
              : criteria.is_active
                ? "This configuration has no sealed version yet."
                : "This configuration is currently inactive."}
          </div>

          <div className="spcm-card-actions">
            {canEdit && hasDraft && (
              <>
                <button
                  type="button"
                  className="spcm-button spcm-button-light"
                  onClick={() => startEditingDraft(criteria)}
                  disabled={saving}
                >
                  Edit draft
                </button>

                <button
                  type="button"
                  className="spcm-button spcm-button-seal"
                  onClick={() => openConfirmation("sealVersion", criteria)}
                  disabled={saving}
                >
                  Seal draft
                </button>
              </>
            )}

            {canCreate && hasSealedVersion && !hasDraft && (
              <button
                type="button"
                className="spcm-button spcm-button-light"
               onClick={() => openConfirmation("createVersion", criteria)}
                disabled={saving}
              >
                Create next draft
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                className={`spcm-button ${
                  criteria.is_active
                    ? "spcm-button-danger"
                    : "spcm-button-primary"
                }`}
                onClick={() =>
                    openConfirmation(
                        criteria.is_active ? "deactivate" : "activate",
                        criteria
                    )
                }
                disabled={saving || (!criteria.is_active && !hasSealedVersion)}
                title={
                  !criteria.is_active && !hasSealedVersion
                    ? "Seal a version before activating this configuration."
                    : ""
                }
              >
                {criteria.is_active ? "Deactivate" : "Activate"}
              </button>
            )}
          </div>
        </div>
      </article>
    );
  };

  const renderForm = () => {
    const isEditing = Boolean(editingCriteriaId);

    return (
      <form
        className="spcm-form"
        onSubmit={
          isEditing
            ? handleUpdateDraft
            : handleCreateConfiguration
        }
      >
        <div className="spcm-form-heading">
          <div>
            <span className="spcm-card-eyebrow">
              {isEditing ? "EDIT CONFIGURATION" : "NEW CONFIGURATION"}
            </span>

            <h3>
              {isEditing
                ? "Update promotion criteria draft"
                : "Create promotion criteria"}
            </h3>

            <p>
              Define the thresholds, terms, and subjects required for
              progression evaluations.
            </p>
          </div>

          <button
            type="button"
            className="spcm-close-button"
            onClick={resetForm}
            aria-label="Close form"
          >
            ×
          </button>
        </div>

        {!isEditing && (
          <div className="spcm-field">
            <label htmlFor="spcm-academic-level">
              Configuration scope
            </label>

            <select
              id="spcm-academic-level"
              value={form.academicLevelId}
              onChange={(event) => {
                setForm(createEmptyForm(event.target.value));
              }}
              disabled={saving}
            >
              <option value="">School-wide default</option>

              {supportingData.levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>

            <small>
              A level-specific configuration takes precedence over the
              school-wide default when active.
            </small>
          </div>
        )}

        <div className="spcm-threshold-grid">
          <div className="spcm-field">
            <label htmlFor="spcm-average">
              Minimum session average (%)
            </label>
            <input
              id="spcm-average"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.minimumSessionAverage}
              onChange={(event) =>
                updateFormField("minimumSessionAverage", event.target.value)
              }
              disabled={saving}
            />
          </div>

          <div className="spcm-field">
            <label htmlFor="spcm-pass-mark">
              Subject pass mark (%)
            </label>
            <input
              id="spcm-pass-mark"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.subjectPassMark}
              onChange={(event) =>
                updateFormField("subjectPassMark", event.target.value)
              }
              disabled={saving}
            />
          </div>

          <div className="spcm-field">
            <label htmlFor="spcm-min-subjects">
              Minimum subjects passed
            </label>
            <input
              id="spcm-min-subjects"
              type="number"
              min="0"
              step="1"
              value={form.minimumSubjectsPassed}
              onChange={(event) =>
                updateFormField("minimumSubjectsPassed", event.target.value)
              }
              disabled={saving}
            />
          </div>
        </div>


                {combinationValidation.requiresCombinations && (
          <div className="spcm-inline-warning">
            {combinationValidation.missingLevels.length > 0 ? (
              <>
                <strong>Subject combinations need attention.</strong>
                <p>
                  These levels require at least one valid active
                  combination:
                  {" "}
                  {combinationValidation.missingLevels
                    .map((level) => level.name)
                    .join(", ")}
                  .
                </p>
              </>
            ) : combinationValidation.emptyIntersections.length > 0 ? (
              <>
                <strong>Some combinations have no selected subjects.</strong>
                <p>
                  Add at least one subject shared with each of these
                  combinations:
                  {" "}
                  {combinationValidation.emptyIntersections
                    .map(
                      (combination) =>
                        `${combination.stream_name} – ${combination.name}`
                    )
                    .join(", ")}
                  .
                </p>
              </>
            ) : (
              <>
                <strong>Combination-aware threshold</strong>
                <p>
                  Across {combinationValidation.combinationCount} valid
                  active combination
                  {combinationValidation.combinationCount === 1 ? "" : "s"},
                  the maximum minimum-subjects-passed threshold is{" "}
                  {combinationValidation.minimumApplicableSubjectCount}.
                </p>
              </>
            )}
          </div>
        )}

        <section className="spcm-selection-section">
          <div className="spcm-selection-heading">
            <div>
              <h4>Required academic terms</h4>
              <p>
                Term display orders must be available in every session that
                already has terms configured.
              </p>
            </div>

            <span className="spcm-selection-count">
              {form.termDisplayOrders.length} selected
            </span>
          </div>

          {availableTermOrders.length === 0 ? (
            <div className="spcm-inline-warning">
              No common term display orders are currently available. Configure
              terms in academic sessions before creating criteria.
            </div>
          ) : (
            <div className="spcm-choice-grid">
              {availableTermOrders.map((order) => (
                <label className="spcm-choice" key={order}>
                  <input
                    type="checkbox"
                    checked={form.termDisplayOrders.includes(order)}
                    onChange={() =>
                      toggleArrayValue("termDisplayOrders", order)
                    }
                    disabled={saving}
                  />
                  <span>
                    <strong>{getTermLabel(order)}</strong>
                    <small>Display order {order}</small>
                  </span>
                </label>
              ))}
            </div>
          )}

          {availableSessions.length > 0 && (
            <small className="spcm-coverage-note">
              Checked against {availableSessions.length} session
              {availableSessions.length === 1 ? "" : "s"} with configured terms.
            </small>
          )}
        </section>

        <section className="spcm-selection-section">
          <div className="spcm-selection-heading">
            <div>
              <h4>Required subjects</h4>
              <p>
                {form.academicLevelId
                  ? "Only subjects assigned to this academic level are available."
                  : "Only subjects assigned to every academic level are available for the school-wide default."}
              </p>
            </div>

            <span className="spcm-selection-count">
              {form.subjectIds.length} selected
            </span>
          </div>

          {availableSubjects.length === 0 ? (
            <div className="spcm-inline-warning">
              No eligible subjects are available for this configuration scope.
              Check the subject-to-academic-level assignments.
            </div>
          ) : (
            <div className="spcm-subject-grid">
              {availableSubjects.map((subject) => (
                <label className="spcm-subject-choice" key={subject.id}>
                  <input
                    type="checkbox"
                    checked={form.subjectIds.includes(subject.id)}
                    onChange={() => toggleArrayValue("subjectIds", subject.id)}
                    disabled={saving}
                  />

                  <span className="spcm-subject-initial">
                    {subject.name?.charAt(0)?.toUpperCase() || "S"}
                  </span>

                  <span className="spcm-subject-details">
                    <strong>{subject.name}</strong>
                    <small>
                      {subject.code || "No code"}
                      {subject.is_core ? " · Core subject" : ""}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        <div className="spcm-form-footer">
          <p>
            {isEditing
              ? "Changes apply only to this unsealed draft."
              : "This configuration will be created inactive with an editable draft."}
          </p>

          <div className="spcm-card-actions">
            <button
              type="button"
              className="spcm-button spcm-button-light"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="spcm-button spcm-button-primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save draft changes"
                  : "Create draft"}
            </button>
          </div>
        </div>
      </form>
    );
  };

  return (
    <section className="student-promotion-criteria-manager">
      <div className="spcm-section-header">
        <div className="spcm-section-title">
          <span className="spcm-section-icon">⚙</span>
          <div>
            <span className="spcm-card-eyebrow">
              PROGRESSION RULES
            </span>
            <h2>Promotion criteria management</h2>
            <p>
              Configure the academic requirements used to evaluate student
              promotion and repetition.
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            type="button"
            className="spcm-button spcm-button-primary"
            onClick={startCreatingConfiguration}
            disabled={saving || showCreateForm || Boolean(editingCriteriaId)}
          >
            + New configuration
          </button>
        )}
      </div>

      <div className="spcm-guidance">
        <div className="spcm-guidance-item">
          <span className="spcm-guidance-number">01</span>
          <div>
            <strong>Create a draft</strong>
            <p>Set thresholds, required terms, and subjects.</p>
          </div>
        </div>

        <div className="spcm-guidance-item">
          <span className="spcm-guidance-number">02</span>
          <div>
            <strong>Seal the version</strong>
            <p>Lock the criteria against further changes.</p>
          </div>
        </div>

        <div className="spcm-guidance-item">
          <span className="spcm-guidance-number">03</span>
          <div>
            <strong>Activate separately</strong>
            <p>Choose when the sealed criteria become effective.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="spcm-message spcm-message-error" role="alert">
          <strong>Something needs attention</strong>
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {notice && (
        <div className="spcm-message spcm-message-success" role="status">
          <strong>Success</strong>
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}

      {warning && (
        <div className="spcm-message spcm-message-warning" role="alert">
          <strong>{warning.message || "Fallback configuration warning"}</strong>

          {warning.affectedLevels?.length > 0 && (
            <ul>
              {warning.affectedLevels.map((level) => (
                <li key={level.id}>
                  {level.name || "Affected academic level"}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showCreateForm && canCreate && renderForm()}

      {editingCriteriaId && canEdit && renderForm()}

      <div className="spcm-configurations-heading">
        <div>
          <h3>Configured promotion criteria</h3>
          <p>
            School-wide defaults and academic-level-specific configurations.
          </p>
        </div>

        <span className="spcm-total-count">
          {configurations.length} configuration
          {configurations.length === 1 ? "" : "s"}
        </span>
      </div>

      {loading ? (
        <div className="spcm-loading">
          <span className="spcm-loading-spinner" />
          <p>Loading promotion criteria...</p>
        </div>
      ) : configurations.length === 0 ? (
        <div className="spcm-empty-state">
          <span className="spcm-empty-icon">📋</span>
          <h3>No promotion criteria configured yet</h3>
          <p>
            Create a school-wide default or configure requirements for an
            individual academic level.
          </p>

          {canCreate && (
            <button
              type="button"
              className="spcm-button spcm-button-primary"
              onClick={startCreatingConfiguration}
              disabled={showCreateForm || Boolean(editingCriteriaId)}
            >
              Create first configuration
            </button>
          )}
        </div>
      ) : (
        <div className="spcm-criteria-list">
          {configurations.map(renderCriteriaCard)}
        </div>
      )}

      <div className="spcm-manager-footer">
        <span>
          <span className="spcm-footer-dot" />
          Changes are validated and stored by the school backend.
        </span>

        <button
          type="button"
          className="spcm-refresh-button"
          onClick={loadManagerData}
          disabled={loading || saving}
        >
          ↻ Refresh configurations
        </button>
      </div>
      {confirmation && (
        <ConfirmDialog
            title={confirmation.title}
            message={confirmation.message}
            confirmLabel={confirmation.confirmLabel}
            loadingLabel={confirmation.loadingLabel}
            confirmClassName={
            confirmation.confirmClassName || "confirm-dialog__confirm"
            }
            loading={saving}
            onConfirm={handleConfirmAction}
            onCancel={() => {
            if (!saving) {
                setConfirmation(null);
            }
            }}
        />
        )}
    </section>
  );
};

export default StudentPromotionCriteriaManager;
