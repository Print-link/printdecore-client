import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./index.css";
import App from "./App.tsx";
import { UpdatePrompt } from "./components/UpdatePrompt";
import { Toaster } from "./components/Toaster";
// Catch the browser's install offer as early as possible
import "./pwa/install";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
		<Toaster />
		<UpdatePrompt />
	</StrictMode>
);
