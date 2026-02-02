export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config")
  }
}

export const onRequestError = async (
  error: Error & { digest?: string },
  request: {
    path: string
    method: string
    headers: Record<string, string>
  },
  context: {
    routerKind: "Pages Router" | "App Router"
    routePath: string
    routeType: "render" | "route" | "action" | "middleware"
    revalidateReason: "on-demand" | "stale" | undefined
    renderSource:
      | "react-server-components"
      | "react-server-components-payload"
      | "server-rendering"
      | undefined
  }
) => {
  const Sentry = await import("@sentry/nextjs")
  Sentry.captureException(error, {
    extra: {
      request: {
        path: request.path,
        method: request.method,
      },
      context,
    },
  })
}
