import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { clearCredentials } from "./store/slices/authSlice";
import { NotificationProvider } from "./contexts/NotificationContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./constants/colors.css";
import "./i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

// When the axios interceptor cannot refresh the token, dispatch a logout
globalThis.addEventListener("auth:logout", () => {
  store.dispatch(clearCredentials());
});

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <ThemeProvider>
        <HeroUIProvider>
          <ToastProvider placement="top-center" toastOffset={20} />
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </HeroUIProvider>
      </ThemeProvider>
    </Provider>
  </QueryClientProvider>,
);
