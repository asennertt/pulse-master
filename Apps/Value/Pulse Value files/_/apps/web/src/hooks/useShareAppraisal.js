import { useState } from "react";

export function useShareAppraisal(appraisalId) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const response = await fetch(`/api/appraisals/${appraisalId}/share`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to generate share link");
      const data = await response.json();
      setShareUrl(data.url);
      setShowShareModal(true);
    } catch (error) {
      console.error(error);
      alert("Failed to generate share link");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return {
    showShareModal,
    setShowShareModal,
    shareUrl,
    copied,
    handleShare,
    handleCopyLink,
  };
}
