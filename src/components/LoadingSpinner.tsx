import "./LoadingSpinner.scss";

const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading Arc Raiders data...</p>
    </div>
  );
};

export default LoadingSpinner;
