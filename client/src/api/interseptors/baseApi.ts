import {  baseApi } from "../";

baseApi.interceptors.request.use(
  function (config:any) {
    return config;
  },
  function (error:any) {
    return Promise.reject(error);
  }
);
