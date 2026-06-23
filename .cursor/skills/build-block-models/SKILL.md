---
name: build-block-models
description: Create and maintain content models for AEM Edge Delivery Services blocks. Generates _blockname.json files containing component definitions, models, and filters for Universal Editor authoring. Use when creating a new block model, adding fields to a block, defining block options/variants, setting up container blocks with children, or before running the building-blocks skill. This is a prerequisite for the building-blocks skill.
---

# Build Block Models

Create content models for AEM Edge Delivery Services blocks. Models define the authoring interface in Universal Editor — what fields authors see, what content they can create, and how that content maps to the block's HTML structure.

**This skill is a prerequisite before running the building-blocks skill.** Content models must be defined before implementing block JS/CSS, because the model determines the HTML structure the block decoration code will receive.

## Workflow

Track progress:
- [ ] Step 1: Determine block structure type
- [ ] Step 2: Design the field schema
- [ ] Step 3: Create the `_blockname.json` file
- [ ] Step 4: Validate with linting
- [ ] Step 5: Rebuild aggregated JSON files

## Step 1: Determine Block Structure Type

Examine the block's requirements and choose the appropriate structure:

| Type | When to Use | Example |
|------|-------------|---------|
| **Simple** | Block has its own properties rendered as rows | Hero, Banner |
| **Key-Value** | Block is read as configuration pairs | Section Metadata, Featured Articles |
| **Container** | Block accepts repeatable child items | Cards, Carousel, Our Partners |

**Simple block** — each property becomes a row in the table:
```
+------------------+
| Hero             |
+==================+
| (image row)      |
+------------------+
| (text row)       |
+------------------+
```

**Container block** — block-level properties first, then repeatable children as multi-column rows:
```
+-----------------------------------+
| Cards                             |
+===================================+
| (card 1 image) | (card 1 text)   |
+-----------------------------------+
| (card 2 image) | (card 2 text)   |
+-----------------------------------+
```

For detailed structural mechanics, see [references/content-modeling.md](references/content-modeling.md).

## Step 2: Design the Field Schema

Choose fields based on the content each property represents. For every field, determine:

1. **`component`** — the UI widget (e.g. `text`, `richtext`, `reference`, `select`)
2. **`name`** — the property name used for persistence and rendering
3. **`label`** — the human-readable label shown to authors
4. **`valueType`** — data type (`string`, `number`, `boolean`, `date`)

### Field Naming Rules

- Use camelCase for field names
- Underscores (`_`) are **not allowed** in field names (reserved by the xwalk plugin)
- Use field collapse suffixes to combine related fields into single semantic elements:
  - `imageAlt` → collapses with `image` to produce `<img alt="...">`
  - `linkText`, `linkTitle`, `linkType` → collapse with `link`
  - `headingType` → collapses with `heading` to set heading level
- Use element grouping (prefix + `_`) only for grouping multiple fields into one cell (e.g. `teaserText_title`, `teaserText_description`)

### Choosing the Right Component Type

| Content Type | Component | Notes |
|---|---|---|
| Single-line text | `text` | Use for short labels, alt text, names |
| Multi-line plain text | `textarea` | Use for descriptions, longer content |
| Rich text (HTML) | `richtext` | Paragraphs, lists, formatted content |
| Image/asset | `reference` | Opens AEM asset picker |
| Page/content link | `aem-content` | Opens AEM content picker |
| Toggle on/off | `boolean` | Renders as a toggle switch |
| Dropdown single | `select` | Requires `options` array |
| Dropdown multi | `multiselect` | Requires `options` array |
| Checkboxes | `checkbox-group` | Requires `options` array |
| Radio buttons | `radio-group` | Requires `options` array |
| Number | `number` | Supports min/max validation |
| Date/time | `date-time` | Supports format configuration |
| Content Fragment | `aem-content-fragment` | Fragment picker with optional variation |
| Experience Fragment | `aem-experience-fragment` | XF picker with optional variation |
| AEM Tag | `aem-tag` | Tag taxonomy picker |
| Field group | `container` | Groups fields; supports `multi: true` for composite multi-fields |
| Tab separator | `tab` | Groups fields into tabs in the properties panel |

For full field type details including validation options, see [references/field-types.md](references/field-types.md).

## Step 3: Create the `_blockname.json` File

Every block model file lives at `blocks/{blockname}/_blockname.json` and contains three arrays: `definitions`, `models`, and `filters`.

### Simple Block Template

```json
{
  "definitions": [
    {
      "title": "Block Title",
      "id": "blockname",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "Block Title",
              "model": "blockname"
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "blockname",
      "fields": [
        {
          "component": "reference",
          "valueType": "string",
          "name": "image",
          "label": "Image",
          "multi": false
        },
        {
          "component": "text",
          "valueType": "string",
          "name": "imageAlt",
          "label": "Alt Text",
          "value": ""
        },
        {
          "component": "richtext",
          "name": "text",
          "value": "",
          "label": "Text",
          "valueType": "string"
        }
      ]
    }
  ],
  "filters": []
}
```

### Container Block Template

```json
{
  "definitions": [
    {
      "title": "Block Title",
      "id": "blockname",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "Block Title",
              "filter": "blockname"
            }
          }
        }
      }
    },
    {
      "title": "Block Item",
      "id": "blockname-item",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block/item",
            "template": {
              "name": "Block Item",
              "model": "blockname-item"
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "blockname-item",
      "fields": [
        {
          "component": "reference",
          "valueType": "string",
          "name": "image",
          "label": "Image",
          "multi": false
        },
        {
          "component": "richtext",
          "name": "text",
          "value": "",
          "label": "Text",
          "valueType": "string"
        }
      ]
    }
  ],
  "filters": [
    {
      "id": "blockname",
      "components": [
        "blockname-item"
      ]
    }
  ]
}
```

### Key Rules

- **`resourceType`**: Always use `core/franklin/components/block/v1/block` for blocks. Never create custom AEM components.
- **`resourceType` for items**: Use `core/franklin/components/block/v1/block/item` for container children.
- **`resourceType` for sections**: Use `core/franklin/components/section/v1/section`.
- **`name`** in template: The block name rendered in the table header — must match the block folder name (title-cased).
- **`model`**: References a model ID from the `models` array.
- **`filter`**: References a filter ID from the `filters` array (container blocks only).
- **`id`** values must be unique across all model files in the project.

### Block Options (Variants)

Use the `classes` property to define block options that add CSS classes:

```json
{
  "component": "multiselect",
  "name": "classes",
  "label": "Style",
  "valueType": "string",
  "options": [
    { "name": "Dark", "value": "dark" },
    { "name": "Wide", "value": "wide" }
  ]
}
```

For multiple independent options, use element grouping with `classes_` prefix:

```json
{
  "component": "select",
  "name": "classes",
  "label": "Variant",
  "valueType": "string",
  "options": [
    { "name": "Default", "value": "" },
    { "name": "Centered", "value": "centered" }
  ]
},
{
  "component": "boolean",
  "name": "classes_fullwidth",
  "label": "Full Width",
  "valueType": "boolean"
}
```

## Step 4: Validate with Linting

Run the linter to verify models follow best practices:

```bash
npm run lint
```

The xwalk ESLint plugin validates model structure. Fix any reported issues. Refer to https://github.com/adobe-rnd/eslint-plugin-xwalk for rule details.

## Step 5: Rebuild Aggregated JSON

After creating or modifying any `_*.json` file, regenerate the aggregated files:

```bash
npm run build:json
```

This updates `component-definitions.json`, `component-models.json`, and `component-filters.json` at the project root.

**Also update the section filter** in `models/_section.json` to include the new block's definition ID in the section's `components` array — otherwise authors cannot add the block to pages.

## Common Patterns

### Image with Alt Text (Field Collapse)

```json
{
  "component": "reference",
  "valueType": "string",
  "name": "image",
  "label": "Image",
  "multi": false
},
{
  "component": "text",
  "valueType": "string",
  "name": "imageAlt",
  "label": "Alt Text",
  "value": ""
}
```

### Link with Text and Type (Field Collapse)

```json
{
  "component": "aem-content",
  "valueType": "string",
  "name": "link",
  "label": "Link"
},
{
  "component": "text",
  "valueType": "string",
  "name": "linkText",
  "label": "Link Text"
},
{
  "component": "select",
  "name": "linkType",
  "label": "Link Style",
  "valueType": "string",
  "options": [
    { "name": "Default", "value": "" },
    { "name": "Primary", "value": "primary" },
    { "name": "Secondary", "value": "secondary" }
  ]
}
```

### Heading with Configurable Level (Field Collapse)

```json
{
  "component": "text",
  "valueType": "string",
  "name": "heading",
  "label": "Heading"
},
{
  "component": "select",
  "name": "headingType",
  "label": "Heading Level",
  "valueType": "string",
  "options": [
    { "name": "H2", "value": "h2" },
    { "name": "H3", "value": "h3" },
    { "name": "H4", "value": "h4" }
  ]
}
```

### Element Grouping (Multiple Fields → One Cell)

Prefix grouped fields with a shared group name separated by `_`:

```json
{
  "component": "text",
  "valueType": "string",
  "name": "teaserText_subtitle",
  "label": "Subtitle"
},
{
  "component": "text",
  "valueType": "string",
  "name": "teaserText_title",
  "label": "Title"
},
{
  "component": "select",
  "name": "teaserText_titleType",
  "label": "Title Level",
  "valueType": "string",
  "options": [
    { "name": "H2", "value": "h2" },
    { "name": "H3", "value": "h3" }
  ]
},
{
  "component": "richtext",
  "name": "teaserText_description",
  "label": "Description",
  "valueType": "string"
}
```

## Additional Resources

- [references/content-modeling.md](references/content-modeling.md) — Block structure types, type inference, field collapse, and element grouping mechanics
- [references/field-types.md](references/field-types.md) — Complete field type reference with all component types, validation options, and configuration
