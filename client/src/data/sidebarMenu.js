const sidebarMenu = [
  {
    id: 1,
    label: "Dashboard",
    path: "/dashboard",
    icon: "🏠",
    roles: ["admin", "teacher", "accountant", "examOfficer"],
  },

  {
    id: 2,
    label: "Students",
    path: "/dashboard/students",
    icon: "👨‍🎓",
    roles: ["admin", "teacher", "examOfficer"],
  },

  {
    id: 3,
    label: "Teacher",
    path: "/dashboard/teachers",
    icon: "👨‍🏫",
    roles: ["admin", "teacher", "examOfficer"],
  },

  {
    id: 4,
    label: "Classes",
    path: "/dashboard/classes",
    icon: "🏫",
    roles: ["admin", "teacher", "examOfficer"],
  },

  {
    id: 5,
    label: "Sections",
    path: "/dashboard/sections",
    icon: "🏷️",
    roles: ["admin", "teacher", "examOfficer"],
  },

  {
    id: 6,
    label: "Academic Setup",
    path: "/dashboard/academic-setup",
    icon: "⚙️",
    roles: ["admin"],
  },

  {
    id: 7,
    label: "Attendance",
    path: "/dashboard/attendance",
    icon: "📋",
    roles: ["admin", "teacher"],
  },

  {
    id: 8,
    label: "Results",
    path: "/dashboard/results",
    icon: "📊",
    roles: ["admin", "examOfficer"],
  },

  {
    id: 9,
    label: "Parents",
    path: "/dashboard/parents",
    icon: "👨‍👩‍👧",
    roles: ["admin"],
  },

  {
    id: 10,
    label: "Accountant",
    path: "/dashboard/accountant",
    icon: "💰",
    roles: ["admin", "accountant"],
  },

  {
    id: 11,
    label: "Library",
    path: "/dashboard/library",
    icon: "📚",
    roles: ["admin", "teacher"],
  },

  {
    id: 12,
    label: "Reception",
    path: "/dashboard/reception",
    icon: "🛎️",
    roles: ["admin"],
  },

  {
    id: 13,
    label: "Events",
    path: "/dashboard/events",
    icon: "📅",
    roles: ["admin", "teacher", "examOfficer"],
  },

  {
    id: 14,
    label: "Settings",
    path: "/dashboard/settings",
    icon: "⚙️",
    roles: ["admin"],
  },
];

export default sidebarMenu;