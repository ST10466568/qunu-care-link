import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("Starting React app initialization...");

const rootElement = document.getElementById("root");
console.log("Root element found:", !!rootElement);

if (rootElement) {
  console.log("Creating React root and rendering App...");
  createRoot(rootElement).render(<App />);
  console.log("App rendered successfully");
} else {
  console.error("Root element not found!");
}
