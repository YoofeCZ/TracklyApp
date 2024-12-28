import React from "react";
import "../css/Global.css";

const SplashScreen = ({ isFading }) => {
  return (
    <div className={`splash-screen ${isFading ? "fade-out" : ""}`}>
      <img src="/images/logo.png" alt="Logo aplikace" className="splash-logo" />
      <div className="loading-bar">
        <div className="loading-bar-fill"></div>
      </div>
    </div>
  );
};

export default SplashScreen;
