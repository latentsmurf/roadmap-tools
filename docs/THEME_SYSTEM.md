# Theme System & Design Tokens

## Vision
"Roadmap as a component library." The UI must be able to morph to fit the host website. We achieve this via a comprehensive list of CSS Variables (Design Tokens).

## Token Contract
All tokens are prefixed with `--rm-` to avoid collisions.

### 1. Colors
- `--rm-color-primary`: Main brand color (buttons, active states).
- `--rm-color-primary-foreground`: Text on primary.
- `--rm-color-background`: Main background.
- `--rm-color-surface`: Card/Panel background.
- `--rm-color-border`: Border color.
- `--rm-color-text-main`: Headings, body.
- `--rm-color-text-muted`: Metadata, secondary text.

### 2. Typography
- `--rm-font-sans`: Main font stack.
- `--rm-text-sm`: 14px equivalent.
- `--rm-text-base`: 16px equivalent.

### 3. Geometry
- `--rm-radius-sm`: Buttons, inputs.
- `--rm-radius-lg`: Cards, modals.
- `--rm-space-unit`: Base multiplier for padding (e.g. 4px).

## Style Packs (Presets)

### A. Minimal SaaS (Default)
Clean, Stripe-like, off-white backgrounds, sharp borders.
```css
--rm-radius-sm: 4px;
--rm-font-sans: 'Inter', sans-serif;
--rm-color-surface: #ffffff;
--rm-color-border: #e5e7eb;
```

### B. Docs Compact
Built to sit inside a documentation sidebar or page. High information density.
```css
--rm-text-base: 14px; /* Smaller base */
--rm-space-unit: 2px; /* Tighter spacing */
--rm-radius-lg: 2px;
```

### C. Glass (Linear-like)
Dark mode defaults, translucent backgrounds, backdrop blur.
```css
--rm-color-surface: rgba(255, 255, 255, 0.05);
--rm-backdrop-filter: blur(12px);
--rm-color-border: rgba(255,255,255,0.1);
```

### D. Neon Night (Gamer/Cyber)
Black background, high contrast neon accents.
```css
--rm-color-background: #000000;
--rm-color-primary: #00ff9d;
--rm-font-sans: 'Orbitron', sans-serif; /* Example */
```

### E. Bold Editorial
Large type, brutality, heavy borders.
```css
--rm-color-border: #000000;
--rm-border-width: 2px;
--rm-font-sans: 'Times New Roman', serif;
```
