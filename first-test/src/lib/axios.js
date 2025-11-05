import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:
    process.env.NODE_ENV === "development"
      ? "http://localhost:5000"
      : "https://reimbursement-acu1.onrender.com",
  withCredentials: true,
});

// export const axiosInstance = axios.create({
//   baseURL:
//     process.env.NODE_ENV === "development"
//       ? "http://localhost:5000/api"
//       : "/api",
//   withCredentials: true,
// });

// export const axiosInstance = axios.create({
//   baseURL: "http://localhost:5000/api",
//   withCredentials: true,
// });
