# Embed SDK & Web Component

## Overview
The core artifact is a lightweight JavaScript library `roadmap.js` that registers a standard Web Component: `<roadmap-portal>`.

## 1. Web Component API

### Usage
Add the script to the `<head>` or body.
```html
<script type="module" src="https://roadmapper.app/sdk/v1.js"></script>

<roadmap-portal 
  workspace="acme-corp" 
  roadmap="main-product"
  zoom="snapshot"
  theme="auto">
</roadmap-portal>
```

### Attributes
| Attribute | Required | Description |
| :--- | :--- | :--- |
| `workspace` | Yes | The slug of the workspace. |
| `roadmap` | Yes | The slug of the specific roadmap. |
| `zoom` | No | Initial zoom level (`snapshot`, `standard`, `deep`). Defaults to snapshot. |
| `view` | No | Initial view (`board`, `timeline`). |
| `theme` | No | `light`, `dark`, or `auto`. Defaults to `auto` (system preference). |

## 2. Theming & Token Injection
The component is built with the assumption that it lives in a host page. It uses CSS Shadow Parts or standard CSS Variables if not using Shadow DOM.
*Decision*: Use **Shadow DOM** for layout isolation, but `::part` and CSS Variables for styling.

### CSS Variables (The "Theme Contract")
The embed respects these variables if they exist in the host scope:
```css
:root {
  --rm-font-family: 'Inter', sans-serif;
  --rm-primary: #3b82f6;
  --rm-bg-surface: #ffffff;
  --rm-text-primary: #111827;
  --rm-radius: 8px;
}
```

## 3. React Wrapper
A thin wrapper for strict React usage.

```tsx
import { RoadmapPortal } from '@roadmapper/react';

export default function Page() {
  return (
    <div className="container">
      <RoadmapPortal 
        workspace="acme" 
        roadmap="v1" 
        zoom="standard" 
      />
    </div>
  )
}
```

## 4. Iframe Fallback
For environments where JS is blocked or style isolation is strictly required.
```html
<iframe src="https://roadmapper.app/embed/acme/v1?zoom=snapshot" class="rm-iframe"></iframe>
```
The iframe will send `postMessage` events for height resizing.
