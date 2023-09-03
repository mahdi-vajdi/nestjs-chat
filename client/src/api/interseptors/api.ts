import Cookies from "universal-cookie";

import {api} from "../";

api.interceptors.request.use(
  function (config:any) {
    const cookie = new Cookies();
    const token = cookie.get("token");

    //  set cookie in DEVELOPMEN mode
    //  if we are in the production mode, nothing is placed in the Authorization header
    //  and this will we send automaticlly by withCredentials flag
    if (process.env.NODE_ENV === "development") {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  function (error:any) {
    return Promise.reject(error);
  }
);
