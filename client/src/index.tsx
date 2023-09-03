import React from "react";
import ReactDOM from "react-dom/client";

import { RouterProvider } from "react-router-dom";
import { ConfigProvider } from "antd";
import { Provider as ReduxProvider } from "react-redux";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import swDev from "swDev";
//  router
import router from "./router";
//  styles
import "styles/global.scss";
//  theme
import theme from "config/antd";
//  store
import { store } from "redux/store";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const queryClient = new QueryClient();

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ReduxProvider store={store}>
        <ConfigProvider theme={theme}>
          <RouterProvider
            router={router}
            fallbackElement={<span>loading...</span>}
          />
        </ConfigProvider>
      </ReduxProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

// swDev();
