// Development supports both Vite and the Node.js server's built frontend.
// Production accepts only the explicitly configured website origins.
export function allowedOrigins(env = process.env) {
  const origins = new Set(
    [env.APP_ORIGIN || 'http://localhost:5173', env.PUBLIC_APP_URL]
      .filter(Boolean)
      .map(value => new URL(value).origin),
  );
  if (env.NODE_ENV !== 'production') {
    for (const port of new Set(['5173', String(Number(env.PORT) || 3001)])) {
      for (const host of ['localhost', '127.0.0.1', '[::1]']) {
        origins.add(`http://${host}:${port}`);
      }
    }
  }
  return origins;
}
