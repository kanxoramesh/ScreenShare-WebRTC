import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Client from "./Client";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Client />
  </React.StrictMode>
);
