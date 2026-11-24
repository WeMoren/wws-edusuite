import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

const useAcademicPerformanceAnalytics = ({
  authToken,
  academicSessionId,
  termId,
  enabled = true,
}) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (
      !enabled ||
      !authToken ||
      !academicSessionId ||
      !termId
    ) {
      setAnalytics(null);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    const loadAnalytics = async () => {
      setLoading(true);
      setError("");
      setAnalytics(null);

      try {
        const params = new URLSearchParams({
          academicSessionId,
          termId,
        });

        const response = await fetch(
          `${API_BASE_URL}/academic-analytics/academic-performance?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load academic performance analytics."
          );
        }

        setAnalytics(data);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          console.error(
            "Failed to load academic performance analytics:",
            requestError
          );

          setError(
            requestError.message ||
              "Failed to load academic performance analytics."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      controller.abort();
    };
  }, [
    authToken,
    academicSessionId,
    termId,
    enabled,
  ]);

  return {
    analytics,
    loading,
    error,
  };
};

export default useAcademicPerformanceAnalytics;
