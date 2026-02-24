import { useState } from "react";

export function useEmailAppraisal(appraisalId) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    recipientEmail: "",
    recipientName: "",
    message: "",
  });
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendEmail = async () => {
    if (!emailData.recipientEmail) {
      alert("Please enter recipient email");
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch(`/api/appraisals/${appraisalId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) throw new Error("Failed to send email");

      alert("Email sent successfully!");
      setShowEmailModal(false);
      setEmailData({ recipientEmail: "", recipientName: "", message: "" });
    } catch (error) {
      console.error(error);
      alert("Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  return {
    showEmailModal,
    setShowEmailModal,
    emailData,
    setEmailData,
    sendingEmail,
    handleSendEmail,
  };
}
