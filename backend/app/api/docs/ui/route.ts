import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../../src/config/env.config';

export async function GET(request: NextRequest) {
  try {
    // Allow docs in production for API documentation
    // if (env?.NODE_ENV === 'production') {
    //   return new Response('API documentation is not available in production', {
    //     status: 404,
    //     headers: { 'Content-Type': 'text/plain' }
    //   });
    // }

    // Get the correct backend URL for the Swagger spec
    const backendUrl = env?.BACKEND_URL || (env?.NODE_ENV === 'production' ? '' : 'http://localhost:8000');
    const swaggerUrl = `${backendUrl}/api/docs`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Timeline API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin: 0;
            background: #fafafa;
        }
        .swagger-ui .topbar {
            background-color: #1f2937;
        }
        .swagger-ui .topbar .topbar-wrapper .link {
            color: #ffffff;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
    <script>
        SwaggerUIBundle({
            url: '${swaggerUrl}',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout",
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            docExpansion: "list",
            operationsSorter: "alpha",
            tagsSorter: "alpha",
            tryItOutEnabled: true,
            requestInterceptor: function(request) {
                // Add any default headers here
                request.headers['Content-Type'] = 'application/json';
                return request;
            },
            responseInterceptor: function(response) {
                return response;
            }
        });
    </script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error serving API documentation UI:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
