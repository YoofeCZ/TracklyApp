// config.js
const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : window.location.hostname.startsWith("192.168")
    ? "http://192.168.0.101:5000/api"
    : "http://188.175.32.34/api";

export default API_URL;
