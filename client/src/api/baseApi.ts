import axios from "axios";

const baseApi: any = axios.create({
  baseURL: "http://localhost:8000", //process.env.API_BASE_URL_DEVELOPMENT,
});

//  change axios instance baseUrl for production mode
if (process.env.NODE_ENV === "production") {
  baseApi.baseURL = "http://localhost:8000"; //process.env.API_BASE_URL_PRODUCTION;
}

export default baseApi;
