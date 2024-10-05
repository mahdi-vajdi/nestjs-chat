import { createApi } from "@reduxjs/toolkit/dist/query/react";

//  base query
import { publicBaseQuery } from "..";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: publicBaseQuery("/auth"),
  endpoints: (builder: any) => ({
    login: builder.mutation({
      query: (loginData: any) => ({
        url: "/signin",
        method: "POST",
        body: loginData,
      }),
    }),

    signup: builder.mutation({
      query: (signupData: any) => ({
        url: "/signup",
        method: "POST",
        body: signupData,
      }),
    }),
  }),
});


export const { useLoginMutation, useSignupMutation } = authApi;
