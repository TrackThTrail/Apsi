import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css"; // opcional: estilo global

const container = document.getElementById("root");
if (!container) throw new Error("Elemento #root não encontrado no DOM");
createRoot(container).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
