import React from "react";
import { useOutletContext } from "react-router-dom";

const Results = () => {
  const {
    academicSessions,
    academicTerms,
    classes,
    sections,
    students,
    subjects,
    results,
    setResults,
  } = useOutletContext();

  return (
    <div className="results-page">
      <h1>Results</h1>
      <p>Enter and manage student academic results.</p>

      <div className="results-filters">
        <div>
          <label>Academic Session</label>
          <select>
            <option value="">Select session</option>
            {academicSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Academic Term</label>
          <select>
            <option value="">Select term</option>
            {academicTerms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Class</label>
          <select>
            <option value="">Select class</option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Section</label>
          <select>
            <option value="">Select section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default Results;