# Content Modeling Reference

Source: https://www.aem.live/developer/component-model-definitions

## Block Structure Types

### Simple Blocks

Each property is rendered as a single row in the block table, in the order defined in the model.

**Data:**
```json
{
  "name": "Hero",
  "model": "hero",
  "image": "/content/dam/image.png",
  "imageAlt": "Helix - a shape like a corkscrew",
  "text": "<h1>Welcome to AEM</h1>"
}
```

**Resulting HTML:**
```html
<div class="hero">
  <div>
    <div>
      <picture>
        <img src="/content/dam/image.png" alt="Helix - a shape like a corkscrew">
      </picture>
    </div>
  </div>
  <div>
    <div>
      <h1>Welcome to AEM</h1>
    </div>
  </div>
</div>
```

### Key-Value Blocks

Set `"key-value": true` in the template to render properties as key-value pairs. Used for configuration-style blocks like Section Metadata.

**Data:**
```json
{
  "name": "Featured Articles",
  "model": "spreadsheet-input",
  "key-value": true,
  "source": "/content/site/articles.json",
  "keywords": ["Developer", "Courses"],
  "limit": 4
}
```

**Resulting HTML:**
```html
<div class="featured-articles">
  <div>
    <div>source</div>
    <div><a href="/content/site/articles.json">/content/site/articles.json</a></div>
  </div>
  <div>
    <div>keywords</div>
    <div>Developer,Courses</div>
  </div>
  <div>
    <div>limit</div>
    <div>4</div>
  </div>
</div>
```

### Container Blocks

Container blocks accept children (usually of the same model). Block-level properties render as single-column rows first, then each child renders as a multi-column row.

**Data:**
```json
{
  "name": "Our Partners",
  "model": "text-only",
  "filter": "our-partners",
  "text": "<p>Our community of partners is ...</p>",
  "item_0": {
    "model": "linked-icon",
    "image": "/content/dam/partners/foo.png",
    "imageAlt": "Icon of Foo",
    "link": "https://foo.com/"
  },
  "item_1": {
    "model": "linked-icon",
    "image": "/content/dam/partners/bar.png",
    "imageAlt": "Icon of Bar",
    "link": "https://bar.com"
  }
}
```

**Resulting HTML:**
```html
<div class="our-partners">
  <div>
    <div>Our community of partners is ...</div>
  </div>
  <div>
    <div>
      <picture><img src="/content/dam/partners/foo.png" alt="Icon of Foo"></picture>
    </div>
    <div>
      <a href="https://foo.com">https://foo.com</a>
    </div>
  </div>
  <div>
    <div>
      <picture><img src="/content/dam/partners/bar.png" alt="Icon of Bar"></picture>
    </div>
    <div>
      <a href="https://bar.com">https://bar.com</a>
    </div>
  </div>
</div>
```

### Columns Block

A special block type for layout purposes only:
- No content modeling — offers no custom fields
- Only supports `rows`, `columns`, and `classes` (or `classes_*`) properties
- Only default content (text, title, image, link/button) can be added to cells

## Type Inference

The rendering engine automatically infers semantic meaning from values:

| Value Type | Detection Rule | Rendered As |
|---|---|---|
| **Image** | Asset reference with MIME type `image/*` | `<picture><img src="..."></picture>` |
| **Link** | Non-image reference, or value starting with `https?://` or `#` | `<a href="...">...</a>` |
| **Rich text** | Trimmed value starts with a block element (`p`, `ul`, `ol`, `h1`–`h6`, etc.) | Rich text HTML |
| **Class names** | Property named `classes` | Block options in table header (simple) or value list (container items) |
| **Value lists** | Multi-value property where first value isn't any of the above | Comma-separated list |
| **Plain text** | Everything else | Plain text |

## Field Collapse

Combines multiple properties into a single semantic element using naming suffixes. Properties ending with these suffixes become attributes of the base property rather than standalone values.

**Supported suffixes** (case sensitive): `Title`, `Type`, `MimeType`, `Alt`, `Text`

### Images

Fields `image` + `imageAlt` collapse into:
```html
<picture><img src="/content/dam/red-car.png" alt="A red car on a road"></picture>
```

### Links and Buttons

Fields `link` + `linkTitle` + `linkText` + `linkType` collapse into:
```html
<a href="https://www.adobe.com" title="Navigate to adobe.com">adobe.com</a>
```

`linkType` controls styling:
- No type → default link
- `primary` → bold/strong link (button)
- `secondary` → italic/emphasis link (button)

### Headings

Fields `heading` + `headingType` collapse into:
```html
<h2>Getting started</h2>
```

## Element Grouping

Concatenates multiple semantic elements into a single table cell. Uses a naming convention where the group name is separated from each property by an underscore.

If a field already exists with the group name, it automatically becomes part of the group when grouping is added (no content migration needed).

**Example — Teaser with grouped text cell:**

Fields: `teaserText_subtitle`, `teaserText_title`, `teaserText_titleType`, `teaserText_description`, `teaserText_cta1`, `teaserText_cta1Text`

All render into a single cell:
```html
<div>
  <p>Adobe Experience Cloud</p>
  <h2>Meet the Experts</h2>
  <p>Join us in this ask me everything session...</p>
  <p><a href="https://link.to/more-details">More Details</a></p>
</div>
```

### Element Grouping for Block Options

The `classes` property supports grouping to provide multiple independent option controls:

```json
{
  "classes": "variant-a",
  "classes_background": "light",
  "classes_fullwidth": true
}
```

Renders as: `<div class="teaser variant-a light fullwidth">`

- Text/array fields: values added directly as class names
- Boolean fields: property name (minus `classes_` prefix) added when `true`

## Multi-Fields (Early Access)

Multi-value fields and composite multi-fields allow lists of structured content.

### Single Multi-Field

Set `"multi": true` on a field. Single semantic elements render as `<ul><li>` lists:

```html
<ul>
  <li><a href="https://www.google.com">https://www.google.com</a></li>
  <li><a href="https://www.facebook.com">https://www.facebook.com</a></li>
</ul>
```

Multiple semantic elements (e.g. richtext) render separated by `<hr>` tags.

### Composite Multi-Field

Use a `container` with `"multi": true` and nested `fields`:

```json
{
  "component": "container",
  "name": "images",
  "multi": true,
  "fields": [
    { "component": "reference", "name": "image" },
    { "component": "text", "name": "imageAlt" }
  ]
}
```

Field collapse works within composite items (e.g. `image` + `imageAlt` collapse into `<img alt="...">`).

**Limitation:** Container nesting is not permitted for multi-fields in the properties panel.

## Sections and Section Metadata

Sections use `core/franklin/components/section/v1/section` as resource type. The section model defines the section metadata block, which is automatically appended as a key-value block when non-empty.

```json
{
  "title": "Tab",
  "id": "tab",
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/section/v1/section",
        "template": {
          "name": "Tab",
          "model": "tab",
          "filter": "section"
        }
      }
    }
  }
}
```

## Page Metadata

Define custom page metadata with a model ID of `page-metadata`:

```json
{
  "id": "page-metadata",
  "fields": [
    {
      "component": "text",
      "name": "theme",
      "label": "Theme"
    }
  ]
}
```

Template-specific models use `<template>-metadata` naming (e.g. `blog-metadata`).

## Important Constraints

- **Always use** `core/franklin/components/block/v1/block` — never implement custom AEM components
- **Block name** in template must match the block folder name (title-cased)
- **Model ID** must be unique across all `_*.json` files
- Underscores in field `name` are reserved for element grouping — do not use arbitrarily
- The markup contract between AEM and Edge Delivery Services is fixed and does not allow customization
