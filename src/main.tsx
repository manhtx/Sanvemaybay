
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";
import { reportWebVitals } from "./app/lib/reportWebVitals";

createRoot(document.getElementById("root")!).render(<App />);
reportWebVitals();
