import { fetchBaseQuery } from "@reduxjs/toolkit/dist/query/react";
import Cookies from "universal-cookie";

const baseUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_API_BASE_URL_PRODUCTION
    : process.env.REACT_APP_API_BASE_URL_DEVELOPMENT;

export const privateBaseQuery = (restOfUrl: string) => {
  console.log(`privateBaseQuery: baseurl: ${baseUrl}`);

  const cookie = new Cookies();

  return fetchBaseQuery({
    baseUrl: baseUrl + restOfUrl,
    prepareHeaders: (headers) => {
      const token = cookie.get("access");
      headers.set("authorization", `Bearer ${token}`);
    },
  });
};

export const publicBaseQuery = (restOfUrl: string) => {
  console.log(`privateBaseQuery: baseurl: ${baseUrl}`);

  return fetchBaseQuery({
    baseUrl: baseUrl + restOfUrl,
  });
};
