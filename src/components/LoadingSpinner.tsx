import "./LoadingSpinner.scss";

export default function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading Arc Raiders data...</p>
    </div>
  );
}
