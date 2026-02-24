import { useState, useEffect } from "react";
import { Alert } from "react-native";

export function useAppraisalDetail(appraisalId) {
  const [appraisal, setAppraisal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppraisal();
  }, [appraisalId]);

  const fetchAppraisal = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/appraisals/${appraisalId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch appraisal");
      const data = await response.json();
      setAppraisal(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load appraisal");
    } finally {
      setLoading(false);
    }
  };

  return { appraisal, loading, refetch: fetchAppraisal };
}
