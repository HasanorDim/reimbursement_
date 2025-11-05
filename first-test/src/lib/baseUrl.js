export const baseURL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5000"
    : process.env.REACT_APP_API_URL || window.location.origin;
