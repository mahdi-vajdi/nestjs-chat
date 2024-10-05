import { createSlice } from "@reduxjs/toolkit";

import type { PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  spinner: false,
  selectedChat: null,
  allMessages: [],
  inputValue: null,
  seenMessage: null,
  seenMessageId: null
};

const appSlice = createSlice({
  name: "appSlice",
  initialState,
  reducers: {
    changeSpinner: (state, action: PayloadAction<boolean>) => {
      state.spinner = action.payload;
    },
    changeSelectedChat: (state, action: PayloadAction<any>)=>{
      state.selectedChat = action.payload
    },
    changeAllMessages: (state, action: PayloadAction<any>)=>{
      state.allMessages = action.payload
    },
    changeInputValue: (state, action: PayloadAction<any>)=>{
      state.inputValue = action.payload
    },
    changeSeenMessage: (state, action: PayloadAction<any>)=>{
      state.seenMessage = action.payload
    },
    changeSeenMessageId: (state, action: PayloadAction<any>)=>{
      state.seenMessageId = action.payload
    }
  },
});



export const { changeSpinner, changeSelectedChat, changeAllMessages, changeInputValue, changeSeenMessage, changeSeenMessageId } = appSlice.actions;
export default appSlice.reducer;