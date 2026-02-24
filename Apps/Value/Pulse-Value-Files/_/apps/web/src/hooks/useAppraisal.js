import { useState, useEffect } from "react";

export function useAppraisal(appraisalId) {
  const [appraisal, setAppraisal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppraisal();
  }, [appraisalId]);

  const fetchAppraisal = async () => {
    try {
      const response = await fetch(`/api/appraisals/${appraisalId}`);
      if (!response.ok) throw new Error("Failed to fetch appraisal");
      const data = await response.json();
      setAppraisal(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return { appraisal, loading };
}
