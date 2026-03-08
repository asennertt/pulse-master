import { AsyncLocalStorage } from 'node:async_hooks';
import nodeConsole from 'node:console';
import { Hono } from 'hono';
import { contextStorage, getContext } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { requestId } from 'hono/request-id';
import { createHonoServer } from 'react-router-hono-server/node';
import { serveStatic } from '@hono/node-server/serve-static';
import { serializeError } from 'serialize-error';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { getHTMLForErrorPage } from './get-html-for-error-page';
import { API_BASENAME, api } from './route-builder';

const als = new AsyncLocalStorage<{ requestId: string }>();

for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  const original = nodeConsole[method].bind(console);
  console[method] = (...args: unknown[]) => {
    const requestId = als.getStore()?.requestId;
    if (requestId) {
      original(`[traceId:${requestId}]`, ...args);
    } else {
      original(...args);
    }
  };
}

const app = new Hono();

/**
 * PRODUCTION STATIC ASSET HANDLING
 */
if (process.env.NODE_ENV === 'production') {
  app.use('/assets/*', serveStatic({ root: './build/client' }));
  app.use('/favicon.png', serveStatic({ path: './build/client/favicon.png' }));

  // Intercept the hardcoded dev-overlay script and return a valid empty JS file
  app.get('/src/__create/dev-error-overlay.js', (c) => {
    return c.text('console.log("Dev overlay disabled")', 200, {
      'Content-Type': 'application/javascript',
    });
  });
}

app.use('*', requestId());

app.use('*', (c, next) => {
  const rid = c.get('requestId');
  return als.run({ requestId: rid }, () => next());
});

app.use(contextStorage());

app.onError((err, c) => {
  if (c.req.method !== 'GET') {
    return c.json(
      {
        error: 'An error occurred in your app',
        details: serializeError(err),
      },
      500
    );
  }
  return c.html(getHTMLForErrorPage(err), 200);
});

if (process.env.CORS_ORIGINS) {
  app.use(
    '/*',
    cors({
      origin: process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    })
  );
}

for (const method of ['post', 'put', 'patch'] as const) {
  app[method](
    '*',
    bodyLimit({
      maxSize: 4.5 * 1024 * 1024,
      onError: (c) => {
        return c.json({ error: 'Body size limit exceeded' }, 413);
      },
    })
  );
}

/**
 * SUPABASE AUTH MIDDLEWARE
 * Creates a server-side Supabase client for every request.
 * The authenticated user (if any) is available via c.get('user').
 */
app.use('*', async (c, next) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase env vars not set — skipping auth middleware');
    return next();
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => {
        const cookieHeader = c.req.header('cookie') ?? '';
        return parseCookieHeader(cookieHeader);
      },
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) {
          c.header('Set-Cookie', serializeCookieHeader(name, value, options), { append: true });
        }
      },
    },
  });

  // Also check for Bearer token in Authorization header (for mobile / token relay)
  const authHeader = c.req.header('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // Token relay — the client passed the Supabase access token directly
    // We don't set session here; the token is used via the cookie or
    // we can set it in the client. The server client reads cookies primarily.
  }

  c.set('supabase', supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  c.set('user', user);

  return next();
});

app.route(API_BASENAME, api);

export default await createHonoServer({
  app,
  defaultLogger: false,
});
