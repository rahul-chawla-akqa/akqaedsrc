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

## Blogs (AEM Content Fragments → SSG via Overlay)

Blog posts are authored as **Blogs** Content Fragments
(`/conf/akqaedsrc/settings/dam/cfm/models/blogs`, fields `title`, `description`,
`imageReference`) and published as **static EDS pages** using the json2html
content-fragment overlay. This is SSG — the CF is rendered to HTML at publish time.

- Author/edit the CF in Universal Editor → edits persist to the Content Fragment
  (see the `xwalk.cf` plugin in `blocks/blogs/_blogs.json`).
- On publish, json2html renders `cf-templates/blogs.html` with the CF JSON and
  Edge Delivery ingests the result as a page.
- `blocks/blogs/blogs.js` decorates the resulting rows client-side.

Docs: https://www.aem.live/developer/content-fragment-overlay

### Step 1 — Path mapping + CF model allow-list (Configuration Service)

`paths.json` and `xwalk.json` already contain the mapping
(`/content/dam/akqaedsrc/blogs/:/blogs/`) and the `content-fragment-overlay`
allow-list. If you configure via the admin API instead, POST them to
`public.json`:

```bash
curl -X POST \
  https://admin.hlx.page/config/rahul-chawla-akqa/sites/akqaedsrc/public.json \
  -H 'Content-Type: application/json' \
  -H 'x-auth-token: <YOUR-ADMIN-API-TOKEN>' \
  -d '{
    "paths": {
      "mappings": ["/content/dam/akqaedsrc/blogs/:/blogs/"],
      "includes": ["/content/dam/akqaedsrc/blogs/"]
    },
    "xwalk": {
      "content-fragment-overlay": {
        "/content/dam/akqaedsrc/blogs/**": {
          "includes": ["/conf/akqaedsrc/settings/dam/cfm/models/blogs"]
        }
      }
    }
  }'
```

### Step 2 — Add the overlay to the site content source

```bash
curl -X POST \
  https://admin.hlx.page/config/rahul-chawla-akqa/sites/akqaedsrc/content.json \
  -H 'Content-Type: application/json' \
  -H 'x-auth-token: <YOUR-ADMIN-API-TOKEN>' \
  -d '{
    "overlay": {
      "url": "https://json2html.adobeaem.workers.dev/rahul-chawla-akqa/akqaedsrc/main",
      "type": "markup"
    }
  }'
```

### Step 3 — Configure json2html for the blogs path

```bash
curl -X POST \
  https://json2html.adobeaem.workers.dev/config/rahul-chawla-akqa/akqaedsrc/main \
  -H "Authorization: token <YOUR-ADMIN-API-TOKEN>" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "path": "/blogs/",
      "endpoint": "https://author-p104103-e1884364.adobeaemcloud.com/api/assets/akqaedsrc/blogs/{{id}}.json",
      "regex": "/(?<=\\/blogs\\/)(.+)$/",
      "template": "/cf-templates/blogs.html",
      "relativeURLPrefix": "https://publish-p104103-e1884364.adobeaemcloud.com",
      "useAEMMapping": true,
      "headers": { "Accept": "application/json" },
      "forwardHeaders": ["Authorization"]
    }
  ]'
```

> `useAEMMapping: true` rewrites internal JCR paths (image references, links)
> to EDS URLs before the template renders.

### Step 4 — Publish & preview

Publish the fragment (e.g. `nav`) from AEM, then:

- `https://main--akqaedsrc--rahul-chawla-akqa.aem.page/blogs/nav`

### Verify the CF JSON shape

The template reads `properties.elements.<field>.value`. Confirm the field names
match your model by inspecting the endpoint response:

```
https://author-p104103-e1884364.adobeaemcloud.com/api/assets/akqaedsrc/blogs/nav.json
```

If the structure differs, adjust the `{{...}}` paths in `cf-templates/blogs.html`.
