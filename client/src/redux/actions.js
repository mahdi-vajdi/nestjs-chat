import { createAction } from "@reduxjs/toolkit";

export const socketConnect = createAction("socket/connect");
export const socketDisconnect = createAction("socket/disconnect");
export const sendMessage = createAction("socket/sendMessage");
export const getAllMessages = createAction("socket/getAllMessages");
export const seenMessage = createAction("socket/seenMessage");
export const listenToSeen = createAction("socket/listToSeen");
