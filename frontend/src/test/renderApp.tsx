import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppProviders } from "@/app/providers";
import { AppRoutes, routerFuture } from "@/app/routes";

/** Renders the full application shell at `path`, as a user would see it. */
export function renderApp(path = "/") {
  const user = userEvent.setup();
  const utils = render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]} future={routerFuture}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );
  return { user, ...utils };
}
