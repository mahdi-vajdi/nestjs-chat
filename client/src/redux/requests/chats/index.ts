import { createApi } from "@reduxjs/toolkit/dist/query/react";

//  base query
import { privateBaseQuery } from "..";

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: privateBaseQuery("/chats"),
  tagTypes: ["chats"],
  endpoints: (builder: any) => ({
    getChats: builder.query({
      query: () => "",
      providesTags: ["chats"],
    }),

    createChat: builder.mutation({
      query: (data: string) => ({
        url: "",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result: any, error: any, arg: any) => {
        if (result) return [{ type: "chats", id: arg.id }];
        return null;
      },
    }),
  }),
});

export const { useGetChatsQuery, useCreateChatMutation } = chatApi;
