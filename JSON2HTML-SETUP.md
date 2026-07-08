# JSON2HTML Production Configuration

This documents how to configure Adobe's managed JSON2HTML service for the `/posts` routes
in production (on `aem.page` / `aem.live`).

## Prerequisites

- Your AEM Admin API token (from the AEM Sidekick or Admin API)
- The Mustache templates committed and previewed in the repo (`templates/posts/list.html` and `templates/posts/detail.html`)

## Step 1: Add overlay to site configuration

Add the following overlay to your site's content source configuration:

```json
"overlay": {
  "url": "https://json2html.adobeaem.workers.dev/rahul-chawla-akqa/akqaedsrc/main",
  "type": "markup"
}
```

## Step 2: POST the JSON2HTML configuration

```bash
curl -X POST \
  https://json2html.adobeaem.workers.dev/config/rahul-chawla-akqa/akqaedsrc/main \
  -H "Authorization: token <YOUR-ADMIN-API-TOKEN>" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "path": "/posts/",
      "endpoint": "https://jsonplaceholder.typicode.com/posts",
      "template": "/templates/posts/list.html"
    },
    {
      "path": "/posts/",
      "endpoint": "https://jsonplaceholder.typicode.com/posts/{{id}}",
      "regex": "/\\d+$/",
      "template": "/templates/posts/detail.html"
    }
  ]'
```

## Step 3: Preview

Once configured, preview the path via the AEM Sidekick or directly:

- List: `https://main--akqaedsrc--rahul-chawla-akqa.aem.page/posts`
- Detail: `https://main--akqaedsrc--rahul-chawla-akqa.aem.page/posts/1`

The JSON2HTML worker will fetch from the jsonplaceholder API, render using your Mustache templates,
and serve the result as native EDS pages.

## Local Development

For local development, use the proxy server which simulates JSON2HTML behavior:

```bash
# Option 1: Run both manually
node dev-server.mjs          # starts SSR proxy on :4000
aem up --url http://localhost:4000   # points aem dev server at proxy

# Option 2: Use the npm script
npm run dev
```

This fetches live data from jsonplaceholder and renders using the same templates.

---

## Blogs (AEM Content Fragments)

The `/blogs` routes use AEM Content Fragment data fetched from a GraphQL persisted query,
rendered server-side into EDS block markup.

### Endpoint

```
https://author-p104103-e1884364.adobeaemcloud.com/graphql/execute.json/blog-store/blogpagelist
```

> **Production recommendation**: Use the AEM Publish tier
> (`publish-p104103-e1884364.adobeaemcloud.com`) where persisted queries are publicly
> accessible without auth. This eliminates token management in the JSON2HTML worker.

### JSON2HTML Configuration for Blogs

Add the following entries to the JSON2HTML config POST (alongside the existing `/posts` entries):

```bash
curl -X POST \
  https://json2html.adobeaem.workers.dev/config/rahul-chawla-akqa/akqaedsrc/main \
  -H "Authorization: token <YOUR-ADMIN-API-TOKEN>" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "path": "/blogs/",
      "endpoint": "https://publish-p104103-e1884364.adobeaemcloud.com/graphql/execute.json/blog-store/blogpagelist",
      "template": "/templates/blogs/list.html"
    },
    {
      "path": "/blogs/",
      "endpoint": "https://publish-p104103-e1884364.adobeaemcloud.com/graphql/execute.json/blog-store/blogpagelist",
      "regex": "/[a-z0-9-]+$/",
      "template": "/templates/blogs/detail.html"
    }
  ]'
```

### Preview

- List: `https://main--akqaedsrc--rahul-chawla-akqa.aem.page/blogs`
- Detail: `https://main--akqaedsrc--rahul-chawla-akqa.aem.page/blogs/blog-1`

### Local Development

For local development, pass your AEM Developer Token via environment variable:

```bash
# Option 1: Inline
AEM_TOKEN=<your-dev-token> npm run dev

# Option 2: Export first
export AEM_TOKEN=<your-dev-token>
npm run dev
```

The dev proxy fetches from the AEM Author GraphQL endpoint, flattens the nested CF response,
and renders using the Mustache templates at `templates/blogs/`.

> **Note**: AEM Developer Tokens are short-lived. Regenerate from AEM Developer Console
> when they expire.
