# 📐 Typography & Spacing System

## Typography System

### Font Stack

```css
--font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
  "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
  sans-serif;

/* Monospace for code/numbers */
--font-mono: "SF Mono", "Monaco", "Cascadia Code", "Menlo", "Ubuntu Mono",
  "Courier New", monospace;
```

### Font Sizes

| Size | CSS Variable       | Pixel | Usage                        |
| ---- | ------------------ | ----- | ---------------------------- |
| XS   | `--font-size-xs`   | 12px  | Tags, badges, small labels   |
| SM   | `--font-size-sm`   | 14px  | Secondary text, form labels  |
| Base | `--font-size-base` | 16px  | Body text, default           |
| LG   | `--font-size-lg`   | 18px  | Intro text, larger labels    |
| XL   | `--font-size-xl`   | 20px  | Card titles, section headers |
| 2XL  | `--font-size-2xl`  | 24px  | Page section headers         |
| 3XL  | `--font-size-3xl`  | 30px  | Dashboard titles             |
| 4XL  | `--font-size-4xl`  | 36px  | Hero section titles          |

### Font Weights

| Weight   | Value | Usage                         |
| -------- | ----- | ----------------------------- |
| Normal   | 400   | Body text, paragraphs         |
| Medium   | 500   | Labels, emphasis              |
| Semibold | 600   | Buttons, headings             |
| Bold     | 700   | Main headings, important text |

### Typography Scale

```
h1: 36px / Bold / 1.2 line-height
h2: 30px / Bold / 1.2 line-height
h3: 24px / Bold / 1.2 line-height
h4: 20px / Bold / 1.3 line-height
h5: 18px / Semibold / 1.4 line-height
h6: 16px / Semibold / 1.5 line-height

Body: 16px / Normal / 1.6 line-height
Small: 14px / Normal / 1.5 line-height
Tiny: 12px / Normal / 1.4 line-height
```

### Using Typography

#### HTML Elements

```jsx
<h1>Main Title (36px)</h1>          {/* Hero section */}
<h2>Section Title (30px)</h2>      {/* Page sections */}
<h3>Card Title (24px)</h3>         {/* Component headers */}
<h4>Subsection (20px)</h4>         {/* Sub-headers */}
<h5>Label Text (18px)</h5>         {/* Form labels */}
<h6>Small Header (16px)</h6>       {/* Small sections */}
<p>Body text (16px)</p>            {/* Main content */}
<span className="text-sm">Small text (14px)</span>
<span className="text-xs">Tiny text (12px)</span>
```

#### CSS Classes

```jsx
/* Direct font sizes */
className = "text-xs"; /* 12px */
className = "text-sm"; /* 14px */
className = "text-base"; /* 16px */
className = "text-lg"; /* 18px */
className = "text-xl"; /* 20px */
className = "text-2xl"; /* 24px */
className = "text-3xl"; /* 30px */
className = "text-4xl"; /* 36px */

/* Font weights */
className = "font-normal"; /* 400 */
className = "font-medium"; /* 500 */
className = "font-semibold"; /* 600 */
className = "font-bold"; /* 700 */

/* Combined */
className = "text-2xl font-bold";
className = "text-sm font-medium";
```

#### Inline Styles

```jsx
style={{ fontSize: 'var(--font-size-lg)' }}
style={{ fontWeight: 'var(--font-weight-bold)' }}
style={{ fontFamily: 'var(--font-family)' }}
```

### Line Height

```css
--line-height-tight: 1.2    /* Headings */
--line-height-normal: 1.5   /* Small text */
--line-height-relaxed: 1.6  /* Body text */
--line-height-loose: 1.8    /* Long-form content */
```

### Letter Spacing

```css
Body text: 0                          /* Normal */
Headings: 0.3px - 0.5px            /* Subtle increase */
All caps: 0.5px - 1px              /* More spacing */
Badges/Tags: 0.5px                 /* Increased clarity */
```

---

## Spacing System

### 8px Base Unit

All spacing is built on 8px (0.5rem) increments for consistency:

| Name | Value   | Pixels | Usage            |
| ---- | ------- | ------ | ---------------- |
| xs   | 0.25rem | 4px    | Minimal gaps     |
| sm   | 0.5rem  | 8px    | Small spacing    |
| md   | 1rem    | 16px   | Standard spacing |
| lg   | 1.5rem  | 24px   | Large spacing    |
| xl   | 2rem    | 32px   | Extra large      |
| 2xl  | 3rem    | 48px   | Double large     |
| 3xl  | 4rem    | 64px   | Triple large     |

### Padding

```jsx
/* Using CSS Variables */
<div style={{ padding: 'var(--space-lg)' }}>
  Content
</div>

/* Using Classes */
<div className="p-4">      {/* 16px */}
<div className="p-8">      {/* 32px */}

/* Using Inline Style */
<div style={{ padding: '24px' }}>
<div style={{ paddingTop: '16px', paddingBottom: '16px' }}>

/* Directional Padding */
className="pt-4"           {/* padding-top: 16px */}
className="pb-8"           {/* padding-bottom: 32px */}
className="pl-2"           {/* padding-left: 8px */}
className="pr-4"           {/* padding-right: 16px */}
className="px-6"           {/* padding: 0 24px */}
className="py-8"           {/* padding: 32px 0 */}
```

### Margin

```jsx
/* Using CSS Variables */
<div style={{ margin: 'var(--space-xl)' }}>
<div style={{ marginTop: 'var(--space-lg)' }}>

/* Using Classes */
className="m-0"            {/* margin: 0 */}
className="mt-4"           {/* margin-top: 16px */}
className="mb-8"           {/* margin-bottom: 32px */}
className="ml-2"           {/* margin-left: 8px */}
className="my-6"           {/* margin: 24px 0 */}

/* Using Inline */
style={{ marginBottom: '24px' }}
```

### Gap (Flexbox/Grid)

```jsx
/* Using CSS Variables */
style={{ gap: 'var(--space-lg)' }}

/* Using Classes */
className="gap-1"          {/* gap: 4px */}
className="gap-2"          {/* gap: 8px */}
className="gap-3"          {/* gap: 16px */}
className="gap-4"          {/* gap: 24px */}

/* Using Inline */
style={{ gap: '16px' }}
```

---

## Common Spacing Patterns

### Container Padding

```jsx
{/* Balanced container margins */}
className="container"              {/* Applies padding automatically */}

{/* Custom container with spacing */}
<div style={{
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '32px 24px'              {/* Top/bottom: 32px, Left/right: 24px */}
}}>
  Content
</div>
```

### Card Spacing

```jsx
{
  /* Standard card padding */
}
<div style={{ padding: "var(--space-lg)" }}>
  {" "}
  {/* 24px on all sides */}
  <h3 style={{ marginBottom: "var(--space-md)" }}>Title</h3>
  <p>Content</p>
</div>;
```

### Component Spacing

```jsx
{
  /* Consistent gaps in flex layouts */
}
<div className="flex gap-4">
  {" "}
  {/* 16px gap between items */}
  <button>Action 1</button>
  <button>Action 2</button>
</div>;

{
  /* Grid spacing */
}
<div className="grid gap-3">
  {" "}
  {/* 16px gap between items */}
  <div className="card">Item</div>
</div>;
```

### List Item Spacing

```jsx
{
  /* Vertical spacing in lists */
}
<div className="space-y-4">
  {" "}
  {/* 16px between children */}
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>;
```

---

## Border Radius

### Values

```css
--radius-sm: 6px        /* Subtle curves */
--radius-md: 10px       /* Standard radius */
--radius-lg: 14px       /* Prominent radius */
--radius-xl: 20px       /* Large radius */
--radius-2xl: 24px      /* Very large radius */
```

### Usage

| Element      | Radius | CSS Variable  |
| ------------ | ------ | ------------- |
| Inputs       | 10px   | `--radius-md` |
| Buttons      | 10px   | `--radius-md` |
| Cards        | 14px   | `--radius-lg` |
| Modals       | 20px   | `--radius-xl` |
| Pills/Badges | 999px  | Full rounded  |
| Icons        | 50%    | Circle        |

### Using Border Radius

```jsx
/* Using CSS Variables */
style={{ borderRadius: 'var(--radius-lg)' }}

/* Using Classes */
className="rounded-sm"              {/* 6px */}
className="rounded-md"              {/* 10px */}
className="rounded-lg"              {/* 14px */}
className="rounded-xl"              {/* 20px */}

/* Specific corners */
style={{ borderTopLeftRadius: '10px' }}
```

---

## Responsive Spacing

### Mobile-First Approach

```jsx
/* Small screens (default) */
<div style={{ padding: '16px' }}>

/* Tablet and up */
@media (min-width: 768px) {
  padding: '24px';
}

/* Desktop and up */
@media (min-width: 1024px) {
  padding: '32px';
}
```

### Using Responsive Classes

```jsx
{
  /* Spacing changes by breakpoint */
}
className = "p-4 md:p-6 lg:p-8";
className = "gap-2 md:gap-3 lg:gap-4";
className = "mb-4 md:mb-6 lg:mb-8";
```

### Breakpoints

```
Mobile:  < 480px   (default)
Tablet:  480px+
Medium:  768px+
Desktop: 1024px+
Large:   1400px+
```

---

## Text Utilities

### Text Alignment

```jsx
className="text-center"    {/* center */}
className="text-left"      {/* left */}
className="text-right"     {/* right */}
```

### Text Color

```jsx
className="text-muted"     {/* --text-secondary */}
className="text-brand"     {/* --brand */}
className="text-success"   {/* --success */}
className="text-danger"    {/* --danger */}
className="text-warning"   {/* --warning */}
```

### Text Transform

```jsx
style={{ textTransform: 'uppercase' }}
style={{ textTransform: 'capitalize' }}
style={{ textTransform: 'lowercase' }}
```

### Text Decoration

```jsx
style={{ textDecoration: 'underline' }}
style={{ textDecoration: 'line-through' }}
className="hover:underline"         {/* On hover */}
```

### Opacity

```jsx
className="opacity-50"     {/* 50% opacity */}
className="opacity-75"     {/* 75% opacity */}
style={{ opacity: 0.5 }}
```

---

## Element-Specific Spacing

### Headings

```jsx
/* Heading margins */
<h1 style={{ marginBottom: '24px' }}>Title</h1>
<h2 style={{ marginBottom: '20px', marginTop: '32px' }}>Section</h2>

/* Heading classes */
className="mb-4"                    {/* After heading */}
className="mt-8"                    {/* Before heading */}
```

### Buttons

```jsx
/* Button spacing */
<div className="flex gap-3">       {/* Buttons with gap */}
  <button>Cancel</button>
  <button>Submit</button>
</div>

/* Button sizing with padding */
className="btn btn-md"              {/* 12px 16px */}
className="btn btn-lg"              {/* 16px 24px */}
```

### Forms

```jsx
<div className="form-group gap-2">
  <label>Label</label>
  <input />
  <span className="text-xs">Help text</span>
</div>

/* Spacing between form groups */
<div className="space-y-4">
  <div className="form-group">...</div>
  <div className="form-group">...</div>
</div>
```

### Cards

```jsx
<div className="card p-6">
  <div className="mb-4">
    <h3 className="font-bold">Title</h3>
  </div>
  <p>Content</p>
</div>
```

---

## Whitespace Strategy

### Breathing Room

- **Content Area**: 24-32px padding on all sides
- **Component Gaps**: 16-24px between components
- **Text Spacing**: 24px between sections
- **Vertical Rhythm**: Consistent line-height and spacing

### Visual Hierarchy

```
Large spacing (32px+)   → Major sections
Medium spacing (24px)   → Components/groups
Small spacing (16px)    → Related items
Minimal spacing (8px)   → Tight grouping
```

### Anti-Patterns (Avoid)

```
❌ Too tight:        < 8px between elements
❌ Inconsistent:     Random spacing values
❌ No rhythm:        Spacing doesn't align to grid
❌ Overwhelming:     > 64px in compact areas
```

---

## Implementation Examples

### Common Layouts

#### Centered Content

```jsx
<div
  style={{
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "var(--space-xl)",
  }}
>
  Content
</div>
```

#### Card Grid

```jsx
<div className="grid grid-3 gap-6">
  <div className="card p-8">
    <h3 className="mb-4">Title</h3>
    <p>Content</p>
  </div>
</div>
```

#### Form Section

```jsx
<div className="form-section">
  <div className="form-section-header mb-6">
    <h3>Form Title</h3>
  </div>
  <div className="form-grid gap-4">
    <div className="form-group">
      <label>Field</label>
      <input />
    </div>
  </div>
</div>
```

#### List Items

```jsx
<div className="space-y-3">
  <div className="flex justify-between items-center p-4 border rounded">
    <span>Item</span>
    <button>Action</button>
  </div>
</div>
```

---

## Typography & Spacing Checklist

- [ ] All sizes use CSS variables
- [ ] Spacing is 8px-based
- [ ] Text contrast is sufficient
- [ ] Headings have proper hierarchy
- [ ] Line-heights are readable (1.4-1.8)
- [ ] Components have consistent spacing
- [ ] Responsive spacing is implemented
- [ ] Whitespace enhances readability
- [ ] No orphaned text
- [ ] Proper letter-spacing for UI text

---

**Typography & Spacing System Version**: 1.0  
**Last Updated**: November 2025  
**Status**: Production Ready
