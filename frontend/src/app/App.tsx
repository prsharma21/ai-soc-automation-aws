import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "./providers";
import { AppRoutes, routerFuture } from "./routes";

export function App() {
  return (
    <AppProviders>
      <BrowserRouter future={routerFuture}>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
}
