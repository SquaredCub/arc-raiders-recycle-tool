import { useState } from "react";
import "./ErrorMessage.scss";

interface ErrorMessageProps {
  message: string;
  errorDetails?: string;
  onRetry?: () => void;
}

const buildErrorReport = (message: string, errorDetails?: string): string => {
  const lines = ["--- Error Report ---", `Message: ${message}`];

  if (errorDetails) {
    lines.push(`Details: ${errorDetails}`);
  }

  lines.push(
    `URL: ${window.location.href}`,
    `Browser: ${navigator.userAgent}`,
    `Time: ${new Date().toISOString()}`,
  );

  return lines.join("\n");
};

export default function ErrorMessage({
  message,
  errorDetails,
  onRetry,
}: ErrorMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const report = buildErrorReport(message, errorDetails);
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = report;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="error-container">
      <div className="error-icon">!</div>
      <h2>Error Loading Data</h2>
      <p>{message}</p>
      <div className="error-actions">
        {onRetry && (
          <button onClick={onRetry} className="retry-button">
            Retry
          </button>
        )}
        <button onClick={handleCopy} className="copy-error-button">
          {copied ? "Copied!" : "Copy Error Details"}
        </button>
      </div>
    </div>
  );
}
