# AEM EDS Content Overlay API Reference

## Project Details

| Field | Value |
|-------|-------|
| **Org** | `rahul-chawla-akqa` |
| **Site** | `akqaedsrc` |
| **Branch** | `main` |
| **GitHub Repo** | `https://github.com/rahul-chawla-akqa/akqaedsrc` |
| **Primary Content Source** | `https://author-p104103-e1884364.adobeaemcloud.com/bin/franklin.delivery/rahul-chawla-akqa/akqaedsrc/main` |
| **Overlay Source (json2html)** | `https://json2html.adobeaem.workers.dev/rahul-chawla-akqa/akqaedsrc/main` |
| **Preview URL** | `https://main--akqaedsrc--rahul-chawla-akqa.aem.page/` |
| **Live URL** | `https://main--akqaedsrc--rahul-chawla-akqa.aem.live/` |

---

## Authentication

All API calls require an Adobe IMS access token. Pass it via the `Authorization` header:

```
Authorization: Bearer <IMS_ACCESS_TOKEN>
```

Tokens expire after 24 hours. Generate a new one from the Adobe Developer Console or via `aio login`.

---

## 1. Site Configuration Service API

**Base URL:** `https://admin.hlx.page/config/{org}/sites/{site}`

### 1.1 GET Full Site Config

Retrieve the complete site configuration.

```bash
curl -X GET https://admin.hlx.page/config/rahul-chawla-akqa/sites/akqaedsrc.json \
  -H "Authorization: Bearer $TOKEN"
```

### 1.2 PUT Create Site Config (First-Time Setup)

Creates a new site configuration. Fails with `409 Conflict` if one already exists.

```bash
curl -X PUT https://admin.hlx.page/config/rahul-chawla-akqa/sites/akqaedsrc.json \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  --data '{
  "version": 1,
  "code": {
    "owner": "rahul-chawla-akqa",
    "repo": "akqaedsrc"
  },
  "content": {
    "source": {
      "url": "https://author-p104103-e1884364.adobeaemcloud.com/bin/franklin.delivery/rahul-chawla-akqa/akqaedsrc/main",
      "type": "markup",
      "suffix": ".html"
    }
  }
}'
```

### 1.3 POST Update Content Config (Add/Edit Overlay)

Updates only the content section of the site config. Use this to add or modify the overlay.

**Endpoint:** `POST https://admin.hlx.page/config/{org}/sites/{site}/content.json`

```bash
curl -X POST https://admin.hlx.page/config/rahul-chawla-akqa/sites/akqaedsrc/content.json \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  --data '{
    "source": {
      "url": "https://author-p104103-e1884364.adobeaemcloud.com/bin/franklin.delivery/rahul-chawla-akqa/akqaedsrc/main",
      "type": "markup",
      "suffix": ".html"
    },
    "overlay": {
      "url": "https://json2html.adobeaem.workers.dev/rahul-chawla-akqa/akqaedsrc/main",
      "type": "markup"
    }
  }'
```

**Content Config Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `source.url` | string | Primary content source URL |
| `source.type` | string | Must be `"markup"` for BYOM sources |
| `source.suffix` | string | Optional suffix appended to paths (e.g., `".html"`) |
| `overlay.url` | string | Overlay BYOM endpoint URL |
| `overlay.type` | string | Must be `"markup"` |

### 1.4 POST Remove Overlay

To remove the overlay, POST the content config without the overlay field:

```bash
curl -X POST https://admin.hlx.page/config/rahul-chawla-akqa/sites/akqaedsrc/content.json \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  --data '{
    "source": {
      "url": "https://author-p104103-e1884364.adobeaemcloud.com/bin/franklin.delivery/rahul-chawla-akqa/akqaedsrc/main",
      "type": "markup",
      "suffix": ".html"
    }
  }'
```

---

## 2. json2html Worker API

**Base URL:** `https://json2html.adobeaem.workers.dev`

### 2.1 GET Current json2html Config

```bash
curl -X GET "https://json2html.adobeaem.workers.dev/config/rahul-chawla-akqa/akqaedsrc/main" \
  -H "Authorization: Bearer $TOKEN"
```

### 2.2 POST Create/Update json2html Config

Configures path-to-endpoint mappings for the json2html worker.

**Endpoint:** `POST https://json2html.adobeaem.workers.dev/config/{org}/{site}/{branch}`

```bash
curl -X POST "https://json2html.adobeaem.workers.dev/config/rahul-chawla-akqa/akqaedsrc/main" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data '[
    {
      "path": "/products/",
      "endpoint": "https://dummyjson.com/products/{{id}}",
      "regex": "/[^/]+$/",
      "template": "/templates/products/detail.html"
    },
    {
      "path": "/products",
      "endpoint": "https://dummyjson.com/products",
      "template": "/templates/products/list.html"
    }
  ]'
```

**json2html Config Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | Yes | URL path prefix to match incoming requests |
| `endpoint` | string | Yes | API endpoint URL. Use `{{id}}` as placeholder for the extracted ID |
| `regex` | string | No | Regex to extract an ID from the request URL |
| `template` | string | No | Path to a Mustache template file in the GitHub repo. If omitted, a default HTML structure is generated |
| `headers` | object | No | Custom HTTP headers to send when fetching from the endpoint |
| `forwardHeaders` | array | No | Headers from the admin API request to forward to the endpoint |
| `relativeURLPrefix` | string | No | Prefix for relative URLs in generated HTML (for images, videos, etc.) |
| `arrayKey` | string | No | Key in the JSON response containing an array to iterate |
| `pathKey` | string | No | Key in each array item used to match the requested path |
| `useAEMMapping` | boolean | No | Use AEM path mappings from `/config.json` to rewrite links |

### 2.3 Test json2html Worker Directly

Fetch rendered HTML without going through the Admin API:

```bash
curl "https://json2html.adobeaem.workers.dev/rahul-chawla-akqa/akqaedsrc/main/products/1"
```

---

## 3. Preview / Publish API

### 3.1 Preview a Page

Triggers the overlay lookup and ingests the content into the preview content bus.

```bash
curl -X POST "https://admin.hlx.page/preview/rahul-chawla-akqa/akqaedsrc/main/products/1" \
  -H "Authorization: Bearer $TOKEN"
```

### 3.2 Publish a Page (Go Live)

Promotes the previewed content to the live CDN.

```bash
curl -X POST "https://admin.hlx.page/live/rahul-chawla-akqa/akqaedsrc/main/products/1" \
  -H "Authorization: Bearer $TOKEN"
```

### 3.3 Check Page Status

```bash
curl "https://admin.hlx.page/status/rahul-chawla-akqa/akqaedsrc/main/products/1" \
  -H "Authorization: Bearer $TOKEN"
```

### 3.4 Delete a Previewed/Published Page

```bash
curl -X DELETE "https://admin.hlx.page/preview/rahul-chawla-akqa/akqaedsrc/main/products/1" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4. Overlay Lookup Order

When a preview/publish request is made:

1. Admin API checks the **overlay source** first (json2html worker)
2. If overlay returns `200` -- that HTML is ingested as the page
3. If overlay returns `404`, `401`, or `403` -- falls back to the **primary content source** (AEM Author)
4. If primary source also returns `404` -- the page is not found

---

## 5. Current Active Configuration

### Site Config (version 9)

```json
{
  "content": {
    "source": {
      "url": "https://author-p104103-e1884364.adobeaemcloud.com/bin/franklin.delivery/rahul-chawla-akqa/akqaedsrc/main",
      "type": "markup",
      "suffix": ".html"
    },
    "overlay": {
      "url": "https://json2html.adobeaem.workers.dev/rahul-chawla-akqa/akqaedsrc/main",
      "type": "markup"
    }
  }
}
```

### json2html Worker Mappings

```json
[
  {
    "path": "/products/",
    "endpoint": "https://dummyjson.com/products/{{id}}",
    "regex": "/[^/]+$/",
    "template": "/templates/products/detail.html"
  },
  {
    "path": "/products",
    "endpoint": "https://dummyjson.com/products",
    "template": "/templates/products/list.html"
  }
]
```

### Mustache Templates

- **Product detail:** `templates/products/detail.html`
- **Product list:** `templates/products/list.html`

---

## 6. Key Documentation Links

- [BYOM (Bring Your Own Markup)](https://www.aem.live/developer/byom)
- [Configuration Service Setup](https://www.aem.live/docs/config-service-setup)
- [json2html Service](https://www.aem.live/developer/json2html)
- [Content Fragment Overlay](https://www.aem.live/developer/content-fragment-overlay)
- [AEM Admin API](https://www.aem.live/docs/admin.html)
- [BYOM Demo Repo (App Builder)](https://github.com/larsauffarth/byom-demo)
