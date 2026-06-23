# Field Types Reference

Source: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/field-types

## Field Object Structure

Every field in a model's `fields` array supports these properties:

| Property | Type | Description | Required |
|---|---|---|---|
| `component` | `string` | The UI widget/renderer type | Yes |
| `name` | `string` | Property name for data persistence | Yes |
| `label` | `string` | Human-readable label shown to authors | Yes |
| `description` | `string` | Help text displayed below the field | No |
| `value` | `any` | Default value (also serves as placeholder) | No |
| `valueType` | `string` | Data type: `string`, `string[]`, `number`, `date`, `boolean` | No |
| `required` | `boolean` | Whether the field must have a value | No |
| `readOnly` | `boolean` | Whether the field is read-only | No |
| `hidden` | `boolean` | Whether the field is hidden by default | No |
| `condition` | `object` | Rule to conditionally show/hide the field | No |
| `multi` | `boolean` | Whether the field accepts multiple values | No |
| `validation` | `object` | Validation rules for the field | No |
| `raw` | `any` | Additional data the component can use | No |

**Important:** Underscores (`_`) are not allowed in field names when using the aem or xwalk plugins (reserved for element grouping).

## Component Types

### text

Single-line text input.

```json
{
  "component": "text",
  "name": "title",
  "label": "Title",
  "valueType": "string"
}
```

**Validation options:**

| Property | Type | Description |
|---|---|---|
| `minLength` | `number` | Minimum characters allowed |
| `maxLength` | `number` | Maximum characters allowed |
| `regExp` | `string` | Regular expression the input must match |
| `customErrorMsg` | `string` | Error message for validation failures |

### textarea

Multi-line plain text input.

```json
{
  "component": "textarea",
  "name": "description",
  "label": "Description",
  "valueType": "string"
}
```

### richtext

Multi-line rich text input with formatting toolbar.

```json
{
  "component": "richtext",
  "name": "text",
  "label": "Text",
  "valueType": "string"
}
```

### reference

AEM asset picker for selecting assets (images, documents, etc.).

```json
{
  "component": "reference",
  "name": "image",
  "label": "Image",
  "valueType": "string",
  "multi": false
}
```

### aem-content

AEM content picker for selecting any AEM resource (pages, assets, etc.). Unlike `reference`, this can select any AEM content, not just assets.

```json
{
  "component": "aem-content",
  "name": "link",
  "label": "Link",
  "valueType": "string"
}
```

**Validation options:**

| Property | Type | Description |
|---|---|---|
| `rootPath` | `string` | Restricts picker to this directory and subdirectories |

### boolean

Toggle switch for true/false values.

```json
{
  "component": "boolean",
  "name": "enabled",
  "label": "Enabled",
  "valueType": "boolean"
}
```

**Validation options:**

| Property | Type | Description |
|---|---|---|
| `customErrorMsg` | `string` | Error message for invalid values |

### select

Dropdown for selecting a single option.

```json
{
  "component": "select",
  "name": "variant",
  "label": "Variant",
  "valueType": "string",
  "options": [
    { "name": "Default", "value": "" },
    { "name": "Primary", "value": "primary" },
    { "name": "Secondary", "value": "secondary" }
  ]
}
```

### multiselect

Dropdown for selecting multiple options. Supports grouped options.

```json
{
  "component": "multiselect",
  "name": "style",
  "label": "Style",
  "valueType": "string",
  "options": [
    { "name": "Dark", "value": "dark" },
    { "name": "Wide", "value": "wide" }
  ]
}
```

**Grouped options:**
```json
{
  "component": "multiselect",
  "name": "style",
  "label": "Style",
  "valueType": "string",
  "maxSize": 2,
  "options": [
    {
      "name": "Theme",
      "children": [
        { "name": "Light", "value": "light" },
        { "name": "Dark", "value": "dark" }
      ]
    },
    {
      "name": "Layout",
      "children": [
        { "name": "Full Width", "value": "fullwidth" },
        { "name": "Contained", "value": "contained" }
      ]
    }
  ]
}
```

### checkbox-group

Multiple checkboxes for selecting multiple true/false items.

```json
{
  "component": "checkbox-group",
  "name": "features",
  "label": "Features",
  "valueType": "string[]",
  "options": [
    { "name": "Show Image", "value": "show-image" },
    { "name": "Show Description", "value": "show-description" }
  ]
}
```

### radio-group

Radio buttons for mutually exclusive selection.

```json
{
  "component": "radio-group",
  "name": "alignment",
  "label": "Alignment",
  "valueType": "string",
  "options": [
    { "name": "Left", "value": "left" },
    { "name": "Center", "value": "center" },
    { "name": "Right", "value": "right" }
  ]
}
```

### number

Numeric input with optional min/max validation.

```json
{
  "component": "number",
  "name": "count",
  "label": "Count",
  "valueType": "number",
  "value": 0
}
```

**Additional configuration:**

| Property | Type | Description |
|---|---|---|
| `valueFormat` | `string` | `long` (default) or `double` |

**Validation options:**

| Property | Type | Description |
|---|---|---|
| `numberMin` | `number` | Minimum value |
| `numberMax` | `number` | Maximum value |
| `customErrorMsg` | `string` | Error message for validation failures |

### date-time

Date, time, or combined date-time picker.

```json
{
  "component": "date-time",
  "name": "publishDate",
  "label": "Publish Date",
  "valueType": "date"
}
```

**Additional configuration:**

| Property | Type | Description | Required |
|---|---|---|---|
| `displayFormat` | `string` | Format for displaying the date | Yes |
| `valueFormat` | `string` | Format for storing the date | Yes |

**`valueType` options:** `date`, `date-time`, `time`

**Validation options:**

| Property | Type | Description |
|---|---|---|
| `customErrorMsg` | `string` | Error message when format is not met |

### aem-tag

AEM tag picker for attaching taxonomy tags.

```json
{
  "component": "aem-tag",
  "name": "cq:tags",
  "label": "Tags",
  "valueType": "string"
}
```

### aem-content-fragment

Content Fragment picker with optional variation selection.

```json
{
  "component": "aem-content-fragment",
  "name": "fragment",
  "label": "Content Fragment",
  "valueType": "string",
  "variationName": "fragmentVariation"
}
```

**Additional configuration:**

| Property | Type | Description |
|---|---|---|
| `variationName` | `string` | Variable name to store selected variation (omit to hide variation picker) |

**Validation options:**

| Property | Type | Description |
|---|---|---|
| `rootPath` | `string` | Restricts picker to this directory and subdirectories |

### aem-experience-fragment

Experience Fragment picker with optional variation selection.

```json
{
  "component": "aem-experience-fragment",
  "name": "experienceFragment",
  "label": "Experience Fragment",
  "valueType": "string",
  "variationName": "xfVariation"
}
```

**Additional configuration and validation:** Same as `aem-content-fragment`.

### container

Groups fields together. Supports multifield when `multi: true`.

```json
{
  "component": "container",
  "name": "ctas",
  "label": "Call to Actions",
  "multi": true,
  "collapsible": true,
  "fields": [
    {
      "component": "text",
      "name": "ctaText",
      "label": "CTA Text",
      "valueType": "string"
    },
    {
      "component": "aem-content",
      "name": "ctaLink",
      "label": "CTA Link",
      "valueType": "string"
    }
  ]
}
```

**Additional configuration:**

| Property | Type | Description |
|---|---|---|
| `collapsible` | `boolean` | Whether the container can be collapsed |

**Constraint:** Container nesting is not permitted for multi-fields.

### tab

Organizes fields into tabs in the properties panel. Acts as a separator — fields after a `tab` appear on that tab until the next `tab`.

Fields defined before any tab appear above all tabs.

```json
{
  "component": "tab",
  "label": "Content",
  "name": "contentTab"
},
{
  "component": "richtext",
  "name": "text",
  "label": "Text",
  "valueType": "string"
},
{
  "component": "tab",
  "label": "Settings",
  "name": "settingsTab"
},
{
  "component": "select",
  "name": "classes",
  "label": "Variant",
  "valueType": "string",
  "options": [
    { "name": "Default", "value": "" },
    { "name": "Dark", "value": "dark" }
  ]
}
```
