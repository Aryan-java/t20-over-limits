import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("🏏 Cricket Simulator - App Starting...");

const rootElement = document.getElementById("root");
console.log("Root element:", rootElement);

if (!rootElement) {
  console.error("Root element not found!");
} else {
  try {
    createRoot(rootElement).render(<App />);
    console.log("✅ App rendered successfully");
  } catch (error) {
    console.error("❌ Error rendering app:", error);
  }
}
