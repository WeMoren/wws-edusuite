const ALL_ROLES = [
  "Principal",
  "School Admin",
  "Exam Officer",
  "Head Teacher",
  "Accountant",
];

const TEACHING_ROLES = [
  "Principal",
  "Exam Officer",
  "Head Teacher",
];

const sidebarMenu = [
  {
    id: 1,
    label: "Dashboard",
    path: "/dashboard",
    icon: "🏠",
    roles: ALL_ROLES,
  },
  {
    id: 2,
    label: "Students",
    path: "/dashboard/students",
    icon: "👨‍🎓",
    roles: TEACHING_ROLES,
  },
  {
    id: 3,
    label: "Teacher",
    path: "/dashboard/teachers",
    icon: "👨‍🏫",
    roles: TEACHING_ROLES,
  },
  {
    id: 4,
    label: "Classes",
    path: "/dashboard/classes",
    icon: "🏫",
    roles: TEACHING_ROLES,
  },
  {
    id: 5,
    label: "Sections",
    path: "/dashboard/sections",
    icon: "🏷️",
    roles: TEACHING_ROLES,
  },
  {
    id: 6,
    label: "Academic Setup",
    path: "/dashboard/academic-setup",
    icon: "⚙️",
    roles: ["Principal", "School Admin"],
  },
  {
    id: 7,
    label: "Attendance",
    path: "/dashboard/attendance",
    icon: "📋",
    roles: ["Principal", "Head Teacher", "Exam Officer"],
  },
  {
    id: 8,
    label: "Results",
    path: "/dashboard/results",
    icon: "📊",
    roles: ["Principal", "Exam Officer"],
  },
  {
    id: 9,
    label: "Parents",
    path: "/dashboard/parents",
    icon: "👨‍👩‍👧",
    roles: ["Principal"],
  },
  {
    id: 10,
    label: "Accountant",
    path: "/dashboard/accountant",
    icon: "💰",
    roles: ["Principal", "Accountant"],
  },
  {
    id: 11,
    label: "Library",
    path: "/dashboard/library",
    icon: "📚",
    roles: ["Principal", "Head Teacher"],
  },
  {
    id: 12,
    label: "Reception",
    path: "/dashboard/reception",
    icon: "🛎️",
    roles: ["Principal"],
  },
  {
    id: 13,
    label: "Events",
    path: "/dashboard/events",
    icon: "📅",
    roles: ["Principal", "Head Teacher"],
  },
  {
    id: 16,
    label: "Staff Management",
    path: "/dashboard/staff",
    icon: "👥",
    roles: ["Principal"],
},
  {
    id: 14,
    label: "Settings",
    path: "/dashboard/settings",
    icon: "⚙️",
    roles: ["Principal", "School Admin"],
  },
  {
    id: 15,
    label: "WWS Subscription",
    path: "/dashboard/subscription",
    icon: "💳",
    roles: ["Principal", "School Admin"],
  },
];

export default sidebarMenu;
