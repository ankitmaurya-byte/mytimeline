// CORS headers for Swagger UI endpoint
// Restrict to known domains for security
function getCorsHeaders(req: Request): Record<string, string> {
  const requestOrigin = req.headers.get('origin');
  const isDev = process.env.NODE_ENV !== 'production';
  
  // Build allowed origins from environment variables
  const allowedOrigins = [
    process.env.BACKEND_URL,
    process.env.FRONTEND_ORIGIN,
    ...(process.env.CORS_ADDITIONAL_ORIGINS || '').split(',').map(s => s.trim()),
  ].filter(Boolean) as string[];
  
  const defaultOrigin = allowedOrigins[0] || process.env.BACKEND_URL || '';
  let allowOrigin = requestOrigin || defaultOrigin;
  
  if (!isDev) {
    // In production, only allow whitelisted origins
    if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
      allowOrigin = defaultOrigin;
    }
  } else {
    // In development, allow localhost
    if (requestOrigin?.includes('localhost')) {
      allowOrigin = requestOrigin;
    } else {
      allowOrigin = defaultOrigin;
    }
  }
  
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req)
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = `${url.protocol}//${url.host}`;

  // For production, ensure we use the correct base URL
  // This handles cases where the app might be behind a proxy or load balancer
  const isDev = process.env.NODE_ENV !== 'production';
  const apiVersion = process.env.API_VERSION || 'v1';

  // Construct the Swagger spec URL using environment variables
  // For production, use the correct backend URL
  const backendUrl = isDev 
      ? (process.env.BACKEND_URL || base)
      : (process.env.BACKEND_URL || '');
  const jsonUrl = `${backendUrl}/api/swagger`;

  const swaggerHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
    <style>
      /* Hide the 'Try it out' toggle button; keep Execute visible */
      .opblock .try-out { display: none !important; }

      /* Ensure long JSON lines wrap nicely */
      .swagger-ui .opblock-body pre,
      .swagger-ui .response .microlight,
      .swagger-ui .response .highlight-code pre {
        white-space: pre-wrap;
        word-break: break-word;
      }

      /* EXAMPLE blocks (Example Value | Schema) - BLUE */
      .swagger-ui .example,
      .swagger-ui .example .microlight,
      .swagger-ui .example .highlight-code pre,
      .swagger-ui .model-example .highlight-code pre,
      .swagger-ui .example-value pre {
        background-color: #2C3E50 !important;   /* blue-50 */
        border: 1px solid #BFDBFE !important;   /* blue-200 */
        color: #ffffff !important;              /* blue-800 */
      }

      /* REAL RESPONSE blocks (after Execute) - RED */
      .swagger-ui .response .highlight-code pre,
      .swagger-ui .responses-wrapper .highlight-code pre,
      .swagger-ui .responses-table .response-col_description .highlight-code pre,
      .swagger-ui .response .microlight,
      .swagger-ui .responses-wrapper .microlight {
        background-color: #FEF2F2;   /* red-50 */
        border: 1px solid #FCA5A5;   /* red-300 */
        color: #7F1D1D;              /* red-900 */
      }
    </style>
  </head>
  <body>
    <div id="swagger"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          dom_id: '#swagger',
          url: '${jsonUrl}',
          tryItOutEnabled: true,
          supportedSubmitMethods: ['get','post','put','delete','patch','options'],
          syntaxHighlight: { activated: true, theme: 'agate' },
          requestInterceptor: (req) => {
            req.headers = req.headers || {};
            if (!req.headers['Accept'] && !req.headers['accept']) {
              req.headers['Accept'] = 'application/json, */*;q=0.5';
            }
            if (req.body && typeof req.body === 'object' && !(req.body instanceof FormData)) {
              try {
                req.body = JSON.stringify(req.body);
                if (!req.headers['Content-Type'] && !req.headers['content-type']) {
                  req.headers['Content-Type'] = 'application/json';
                }
              } catch (e) {}
            }
            return req;
          },
          responseInterceptor: (res) => {
            try {
              const headers = res.headers || {};
              const ct = (headers['content-type'] || headers['Content-Type'] || '').toString();
              let text = res.text;
              if (typeof text === 'string') {
                const trimmed = text.trim();
                const looksJson = ct.includes('json') || ct.includes('+json') || trimmed.startsWith('{') || trimmed.startsWith('[');
                if (looksJson) {
                  try {
                    const parsed = JSON.parse(trimmed);
                    res.text = JSON.stringify(parsed, null, 2);
                    res.headers = { ...headers, 'content-type': 'application/json; charset=utf-8' };
                  } catch (e1) {
                    try {
                      const unwrapped = JSON.parse(trimmed);
                      if (typeof unwrapped === 'string' && (unwrapped.trim().startsWith('{') || unwrapped.trim().startsWith('['))) {
                        const parsedInner = JSON.parse(unwrapped);
                        res.text = JSON.stringify(parsedInner, null, 2);
                        res.headers = { ...headers, 'content-type': 'application/json; charset=utf-8' };
                      }
                    } catch (e2) { /* leave as-is */ }
                  }
                }
              }
            } catch (e) { /* ignore parse errors */ }
            return res;
          }
        });
      };
    </script>
  </body>
</html>`;

  return new Response(swaggerHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      ...getCorsHeaders(req)
    },
  });
}
