import { useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
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

const ErrorMessage = ({
  message,
  errorDetails,
  onRetry,
}: ErrorMessageProps) => {
  const { translateUI } = useLanguage();
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
      <h2>{translateUI("error.title")}</h2>
      <p>{message}</p>
      <div className="error-actions">
        {onRetry && (
          <button onClick={onRetry} className="retry-button">
            {translateUI("error.retry")}
          </button>
        )}
        <button onClick={handleCopy} className="copy-error-button">
          {copied ? translateUI("error.copied") : translateUI("error.copyDetails")}
        </button>
      </div>
    </div>
  );
};

export default ErrorMessage;
