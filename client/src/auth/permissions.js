const permissions = {
  admin: {
    students: ["view", "create", "edit", "delete"],
    teachers: ["view", "create", "edit", "delete"],
    classes: ["view", "create", "edit", "delete"],
    sections: ["view", "create", "edit", "delete"],
    academicSetup: ["view", "create", "edit", "delete"],
    attendance: ["view", "create", "edit", "delete"],
    results: ["view", "create", "edit", "delete", "download"],
    accountant: ["view", "create", "edit", "delete"],
    settings: ["view"],
  },

  examOfficer: {
    students: ["view"],
    teachers: ["view"],
    classes: ["view"],
    sections: ["view"],
    academicSetup: ["view"],
    attendance: ["view"],
    results: ["view", "create", "edit", "download"],
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
    accountant: ["view", "create", "edit", "delete"],
  },
};

export const hasPermission = (role, module, action) => {
  return permissions[role]?.[module]?.includes(action) || false;
};

export default permissions;