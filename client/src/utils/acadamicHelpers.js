import academicSessions from "../data/academicSessions";
import academicLevels from "../data/academicLevels";
import classes from "../data/classes";
import sections from "../data/sections";

export const getSessionById = (sessionId) => {
  return academicSessions.find(
    (session) => session.id === sessionId
  );
};

export const getLevelById = (levelId) => {
  return academicLevels.find(
    (level) => level.id === levelId
  );
};

export const getClassById = (classId) => {
  return classes.find(
    (classItem) => classItem.id === classId
  );
};

export const getSectionById = (sectionId) => {
  return sections.find(
    (section) => section.id === sectionId
  );
};


export const getClassFromSection = (sectionId) => {
  const section = getSectionById(sectionId);

  if (!section) {
    return undefined;
  }

  return getClassById(section.classId);
};

export const getLevelFromSection = (sectionId) => {
  const classItem = getClassFromSection(sectionId);

  if (!classItem) {
    return undefined;
  }

  return getLevelById(classItem.academicLevelId);
};

export const getSessionFromClass = (classItem) => {
  if (!classItem) {
    return undefined;
  }

  return getSessionById(classItem.academicSessionId);
};