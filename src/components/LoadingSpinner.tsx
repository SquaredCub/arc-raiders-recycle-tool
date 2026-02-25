import { useLanguage } from "../hooks/useLanguage";
import "./LoadingSpinner.scss";

const LoadingSpinner = () => {
  const { translateUI } = useLanguage();

  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>{translateUI("loading.message")}</p>
    </div>
  );
};

export default LoadingSpinner;
