import type { ReactNode } from "react";
import type { LinksFunction } from "react-router";
import { MantineProvider } from "@mantine/core";
import mantineStyles from "@mantine/core/styles.css?url";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import appStyles from "./styles.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: mantineStyles },
  { rel: "stylesheet", href: appStyles },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
