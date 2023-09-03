import { configureStore } from "@reduxjs/toolkit";

//  slices
import appSlice from "./slices/app"

//  request
import { authApi } from "./requests/auth";
import { chatApi } from "./requests/chats";
import socketMiddleware from "./socketMiddleware";

//  middleware
const customMiddlewares = [
    authApi.middleware,
    chatApi.middleware,
    socketMiddleware
]

const store = configureStore({
    reducer: {
        app: appSlice,
        [authApi.reducerPath]: authApi.reducer,
        [chatApi.reducerPath]: chatApi.reducer,
    },
    devTools: process.env.NODE_ENV !== "production",
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(customMiddlewares),
})


export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
export { store };