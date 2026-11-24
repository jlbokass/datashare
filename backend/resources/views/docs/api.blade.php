<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('scramble.ui.title') }}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.34.1/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>
    <noscript>Enable JavaScript to use the interactive API documentation.</noscript>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.34.1/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            url: '/docs/api.json',
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis],
            layout: 'BaseLayout',
            deepLinking: true,
            docExpansion: 'list',
            filter: true,
            defaultModelsExpandDepth: 0,
            validatorUrl: null,
            persistAuthorization: false,
        });
    </script>
</body>
</html>
