import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store/store";
import App from "./App.tsx";
import "./index.css";

// Loading component for Redux Persist
const PersistLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-500">Loading application...</p>
    </div>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <PersistGate loading={<PersistLoading />} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
);
