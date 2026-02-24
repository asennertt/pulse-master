import { Alert, Linking, Share as RNShare } from "react-native";
import * as Clipboard from "expo-clipboard";

export function useAppraisalActions(appraisalId, vin) {
  const handleShare = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/appraisals/${appraisalId}/share`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error("Failed to create share link");
      const { shareUrl } = await response.json();

      await RNShare.share({
        message: `Check out this vehicle appraisal: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to share appraisal");
    }
  };

  const handleCopyVIN = async () => {
    await Clipboard.setStringAsync(vin);
    Alert.alert("Copied", "VIN copied to clipboard");
  };

  const handleCarfax = () => {
    const url = `https://www.carfaxonline.com/vhrs/${vin}`;
    Linking.openURL(url);
  };

  const handleAutoCheck = () => {
    const url = `https://www.autocheck.com/vehiclehistory/?vin=${vin}`;
    Linking.openURL(url);
  };

  return {
    handleShare,
    handleCopyVIN,
    handleCarfax,
    handleAutoCheck,
  };
}
