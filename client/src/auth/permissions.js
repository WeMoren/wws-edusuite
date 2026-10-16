const FULL_ACCESS = ["view", "create", "edit", "delete"];

const permissions = {
  principal: {
    students: FULL_ACCESS,
    teachers: FULL_ACCESS,
    classes: FULL_ACCESS,
    sections: FULL_ACCESS,
    parents: FULL_ACCESS,
    academicSetup: FULL_ACCESS,
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
    library: FULL_ACCESS,
    reception: FULL_ACCESS,
  },

  schoolAdmin: {
    academicSetup: FULL_ACCESS,
    settings: FULL_ACCESS,
    subscription: ["view", "create", "edit"],
  },

  examOfficer: {
    students: ["view"],
    teachers: ["view"],
    classes: ["view"],
    sections: ["view"],
    academicSetup: ["view"],
    attendance: ["view"],
    results: ["view", "create", "edit", "download", "authorize"],
  },

  teacher: {
    students: ["view"],
    teachers: ["view"],
    classes: ["view"],
    sections: ["view"],
    academicSetup: ["view"],
    attendance: ["view", "create", "edit"],
  },

  accountant: {
    accountant: FULL_ACCESS,
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
