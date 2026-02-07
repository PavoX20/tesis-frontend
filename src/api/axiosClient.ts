import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  console.error(
    "¡Error! La variable de entorno VITE_API_URL no está definida."
  );
  console.error("Asegúrate de tener un .env en local o de configurarla en Vercel.");
}

const axiosClient = axios.create({

  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosClient;