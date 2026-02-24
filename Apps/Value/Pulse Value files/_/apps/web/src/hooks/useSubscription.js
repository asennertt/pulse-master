import { useEffect, useState, useCallback } from "react";

export default function useSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    try {
      const response = await fetch("/api/subscription-status");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const refetch = useCallback(() => {
    setLoading(true);
    return fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    loading,
    refetch,
    tier: subscription?.tier || "free",
    canCreateAppraisal: subscription?.canCreateAppraisal ?? false,
    appraisalsUsed: subscription?.appraisalsUsed || 0,
    appraisalsLimit: subscription?.appraisalsLimit || 3,
  };
}
