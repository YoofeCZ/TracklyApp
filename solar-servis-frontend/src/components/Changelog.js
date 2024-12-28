import React, { useState, useEffect } from "react";
import "../css/Global.css";

const Changelog = ({ changelogKey, changelogText }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissedVersion = localStorage.getItem("dismissedChangelog");
    if (dismissedVersion !== changelogKey) {
      setIsVisible(true);
    }
  }, [changelogKey]);

  const handleDismiss = () => {
    localStorage.setItem("dismissedChangelog", changelogKey);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="changelog">
      <div className="changelog-content">
        <h2>Novinky</h2>
        <p>{changelogText}</p>
        <button onClick={handleDismiss} className="close-button">
          Zavřít
        </button>
      </div>
    </div>
  );
};

export default Changelog;
