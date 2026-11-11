const FULL_ACCESS = ["view", "create", "edit", "delete"];

const permissions = {
  principal: {
    students: FULL_ACCESS,
    teachers: FULL_ACCESS,
    classes: FULL_ACCESS,
    sections: FULL_ACCESS,
    parents: FULL_ACCESS,
    academicSetup: FULL_ACCESS,
    feeStructures: FULL_ACCESS,
    attendance: FULL_ACCESS,
    results: [
      "view",
      "create",
      "edit",
      "delete",
      "download",
      "authorize",
    ],
    accountant: FULL_ACCESS,
    staff: FULL_ACCESS,
    settings: FULL_ACCESS,
    subscription: ["view", "create", "edit"],
    events: FULL_ACCESS,
    recent_activities: ["view"],
    library: FULL_ACCESS,
    reception: FULL_ACCESS,
  },

  schoolAdmin: {
    students: ["view", "create", "edit"],
    academicSetup: FULL_ACCESS,
    feeStructures: FULL_ACCESS,
    settings: FULL_ACCESS,
    subscription: ["view", "create", "edit"],
    events: FULL_ACCESS,
    recent_activities: ["view"]
  },

  examOfficer: {
    students: ["view"],
    teachers: ["view"],
    classes: ["view"],
    sections: ["view"],
    academicSetup:  FULL_ACCESS,
    attendance: ["view"],
    results: ["view", "create", "edit", "download", "authorize"],
    recent_activities: ["view"]
  },

  teacher: {
    students: ["view"],
    teachers: ["view"],
    classes: ["view"],
    sections: ["view"],
    academicSetup: ["view"],
    attendance: ["view", "create", "edit"],
    events: FULL_ACCESS,
    recent_activities: ["view"],
  },

  accountant: {
    accountant: FULL_ACCESS,
     recent_activities: ["view"],
  },
};

// Convert display-role names to internal permission keys.
const normalizeRole = (role) => {
  const roleMap = {
    principal: "principal",
    "school admin": "schoolAdmin",
    admin: "schoolAdmin",
    "exam officer": "examOfficer",
    examofficer: "examOfficer",
    "head teacher": "teacher",
    teacher: "teacher",
    accountant: "accountant",
  };

  return roleMap[String(role ?? "").trim().toLowerCase()];
};

export const hasPermission = (role, module, action) => {
  const normalizedRole = normalizeRole(role);

  return permissions[normalizedRole]?.[module]?.includes(action) ?? false;
};

export default permissions;
