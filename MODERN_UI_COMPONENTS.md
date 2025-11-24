# 🎨 Modern UI/UX Component Examples

## Navigation Header

```jsx
// Modern header with improved spacing and alignment
// - Left: Logo with emoji
// - Center: Navigation links
// - Right: User info + Logout button

Features:
✓ Sticky positioning
✓ Blur backdrop effect
✓ Balanced spacing
✓ Responsive layout
✓ Smooth animations
✓ Clear visual hierarchy
```

---

## Authentication Pages (Login & Register)

```jsx
/* Modern Card Design */
.auth-card {
  • Centered on screen
  • Max-width: 420px
  • Gradient background overlay
  • Rounded corners (20px)
  • Enhanced shadow
  • Padded content area
}

/* Form Layout */
.auth-form {
  • Vertical spacing: 24px
  • Large submit button (full width)
  • Clear error messages
  • Help text below inputs
  • Multiple auth methods supported
}

/* Visual Elements */
• Title with gradient text
• Subtitle in secondary color
• Error messages with red background
• Divider between auth methods
• Link to other auth page
• Smooth animations on load
```

---

## Dashboard Layout

```jsx
/* Header Section */
.dashboard-header {
  • Large h1 title (36px)
  • Right-aligned action buttons
  • Bottom border divider
  • Generous padding
}

/* Card Grid */
.dashboard-grid {
  • Auto-fill columns (350px min)
  • Consistent gap (24px)
  • Responsive on mobile (1 column)
  • Hover lift effect (+4px)
  • Smooth shadow transition
}

/* Individual Cards */
.dashboard-card {
  • Card header with title
  • Metadata badges
  • Action buttons at bottom
  • Status indicators
  • Hover effects
}
```

---

## Exam Cards

```jsx
/* Card Layout */
.exam-item {
  • Horizontal flex layout
  • Left: Exam info
  • Right: Action buttons
  • Divider on top
  • Hover: Lift + glow border
}

/* Information Display */
.exam-item-info {
  • Title (18px, bold)
  • Metadata row (dates, counts)
  • Secondary text color
  • Clear visual separation
}

/* Action Buttons */
.exam-item-actions {
  • View button
  • Edit button (teacher)
  • Delete button
  • Results button
  • Horizontal layout
}

/* Status Badge */
.status-badge {
  • Draft: Blue background
  • Active: Green background
  • Completed: Gray background
  • Uppercase text
  • Small font (12px)
  • Rounded corners
}
```

---

## Question Management

```jsx
/* Questions Section */
.questions-section {
  • Header with title + Add button
  • List of questions
  • Each with edit/delete options
  • Clear numbering
}

/* Question Item */
.question-item {
  • Number badge (left side)
  • Question text (large)
  • Options displayed (2 columns)
  • Answer highlighted (green)
  • Actions on hover
  • Hover: Background color change
}

/* Options Display */
.question-item-options {
  • Grid: 2 columns on desktop
  • Each option: Letter badge + text
  • Correct answer: Green highlight
  • Clear visual distinction
}
```

---

## Form Elements

```jsx
/* Input Field */
.input {
  • Full width in forms
  • Padding: 16px
  • Border: 1px solid (#1e2d4a)
  • Rounded: 10px
  • Focus: Brand border + glow
  • Error: Red border + red glow
  • Placeholder: Muted text
}

/* Form Group */
.form-group {
  • Label (bold, 12px uppercase)
  • Input field
  • Help text (muted, 12px)
  • Error text (red, 12px)
  • Spacing: 8px between items
}

/* Textarea */
.textarea {
  • Min-height: 120px
  • Resize: Vertical
  • Same styling as input
  • Line-height: 1.6
}

/* Select */
.select {
  • Same size/styling as input
  • Dropdown arrow
  • Focus state same as input
}
```

---

## Button Variants

```jsx
/* Primary Button */
<button className="btn btn-primary">
  • Gradient blue background
  • White text
  • Shadow: 4px 12px (brand-colored)
  • Hover: Darker gradient + lift
  • Active: Normal position
</button>

/* Secondary Button */
<button className="btn btn-secondary">
  • Panel light background
  • Secondary text color
  • Border: 1px border-light
  • Hover: Elevated panel + text change
</button>

/* Success Button */
<button className="btn btn-success">
  • Green gradient background
  • White text
  • Green-tinted shadow
  • Hover: Lift effect
</button>

/* Danger Button */
<button className="btn btn-danger">
  • Red gradient background
  • White text
  • Red-tinted shadow
  • Hover: Lift effect
</button>

/* Outline Button */
<button className="btn btn-outline">
  • Transparent background
  • Brand text color
  • Brand border (2px)
  • Hover: Brand light background
</button>

/* Button Sizes */
btn-sm:  8px 12px   (12px font)
btn-md:  12px 16px  (14px font) ← Default
btn-lg:  16px 24px  (16px font)
btn-xl:  20px 32px  (18px font)
```

---

## Modal Dialogs

```jsx
/* Modal Overlay */
.modal-overlay {
  • Position: Fixed (full screen)
  • Background: Black 85% opacity
  • Backdrop filter: Blur(4px)
  • Flex center content
  • Click outside to close
  • Animation: Fade in 0.2s
}

/* Modal Content */
.modal-content {
  • Max-width: 600px (medium)
  • Rounded corners: 20px
  • Large shadow (2xl)
  • Animation: Scale in 0.2s
  • Max-height: 90vh
  • Overflow-y: auto
}

/* Modal Header */
.modal-header {
  • Flex between title and close
  • Border-bottom divider
  • Padding: 24px
  • Title: 20px bold
}

/* Modal Close Button */
.modal-close {
  • Background: None
  • Border: None
  • Color: Muted text
  • Size: 40x40px
  • Hover: Border background
  • Icon: X symbol (SVG)
}

/* Modal Body */
.modal-body {
  • Padding: 24px
  • Scrollable content
  • Form or custom content
}
```

---

## Badge & Tags

```jsx
/* Badge */
<span className="badge badge-primary">
  • Inline-flex display
  • Rounded pill (999px)
  • Padding: 6px 12px
  • Font: 12px bold uppercase
  • Letter-spacing: 0.5px
}

.badge-primary:    Brand background + text
.badge-success:    Green background + text
.badge-warning:    Amber background + text
.badge-danger:     Red background + text
.badge-info:       Blue background + text
.badge-default:    Gray background + text

/* Tag */
<span className="tag">
  • Similar to badge
  • Border: 1px border
  • Background: Panel light
  • Slightly more spacing
</span>
```

---

## Loading Spinner

```jsx
/* Spinner */
<div className="loading-spinner-container">
  • Flex center
  • Min-height: 200px

  <div className="loading-spinner">
    • Width: 48px (medium)
    • Height: 48px
    • Border: 3px solid border
    • Border-top: Brand color
    • Rounded: 50% (circle)
    • Animation: Spin 1s infinite
  </div>
</div>

Sizes:
small:  12px
medium: 32px (default)
large:  48px
```

---

## Progress Indicators

```jsx
/* Exam Timer */
.exam-timer {
  • Background: Gradient panel
  • Border: 1px border
  • Padding: 24px
  • Rounded: 14px

  Timer Display:
  • Icon (left)
  • Time text (monospace font)
  • Progress bar (below)

  Progress Bar:
  • Height: 8px
  • Background: Border color
  • Fill: Gradient (brand → accent)
  • Rounded: 999px

  Warning:
  • When time < 25%
  • Amber background
  • Animated pulse effect
  • Warning message
}

/* Progress Indicator */
.progress-indicator {
  • Background: Gradient
  • Padding: 24px
  • Rounded: 14px

  Stats:
  • 3-4 columns (responsive)
  • Numbers: Large, brand color
  • Labels: Small, muted, uppercase

  Progress Bar:
  • Full width
  • Height: 12px
  • Gradient fill
  • Rounded ends
}
```

---

## Question Navigation

```jsx
/* Question Grid */
.question-nav {
  • Grid: Auto-fill (48px min)
  • Gap: 8px
  • Margin: 24px 0

  Navigation Items:
  • Aspect ratio: 1:1 (square)
  • Border: 1px border
  • Rounded: 10px
  • Font: Bold, centered
  • Cursor: Pointer
}

/* Question Nav States */
.question-nav-item:
  • Default: Panel background
  • Hover: Border light
  • Current: Brand gradient + white text
  • Answered: Green gradient + white text
  • Flagged: Amber gradient + white text
```

---

## Question Display

```jsx
/* Question Container */
.question-container {
  • Background: Gradient panel
  • Border: 1px border
  • Padding: 24px
  • Margin-bottom: 24px

  Question Header:
  • Flex between
  • Question number badge (left)
  • Flag button (right)

  Question Text:
  • Font: 18px
  • Weight: Medium
  • Line-height: 1.8
  • Margin-bottom: 24px
}

/* Question Options */
.question-options:
  • Flex column
  • Gap: 16px

  Each Option:
  • Flex layout
  • Padding: 24px
  • Border: 2px solid
  • Rounded: 10px
  • Cursor: Pointer
  • Hover: Brand border + light bg

  Selected Option:
  • Border: Brand color
  • Background: Brand light
  • Box-shadow: Brand glow

  Radio Circle:
  • Size: 24px
  • Border: 2px
  • Selected: Brand fill + checkmark
  • Rounded: 50% (circle)

  Option Text:
  • Flex: 1
  • Line-height: 1.6
  • Responsive: Wraps on mobile
}
```

---

## Results Display

```jsx
/* Results Container */
.results-container {
  • Background: Gradient panel
  • Border: 1px border
  • Padding: 48px
  • Rounded: 14px
  • Text-align: Center

  Score Display:
  • Font: 36px bold
  • Gradient text (brand → accent)
  • Margin-bottom: 16px

  Stats Grid:
  • Responsive columns
  • Min-width: 150px
  • Gap: 24px

  Each Stat:
  • Card background
  • Padding: 24px
  • Rounded: 14px
  • Border: 1px border

  Stat Value:
  • Font: 24px bold
  • Color: Brand
  • Margin-bottom: 8px

  Stat Label:
  • Font: 12px uppercase
  • Color: Secondary
  • Letter-spacing: 0.5px
}
```

---

## Table Styling

```jsx
/* Table Container */
.table-container {
  • Overflow-x: Auto
  • Rounded: 14px
  • Box-shadow: Small

  Table:
  • Width: 100%
  • Collapse: Borders
  • Background: Panel

  Header:
  • Background: Gradient panel
  • Border-bottom: 2px brand
  • Font-weight: Bold
  • Font-size: 12px uppercase
  • Padding: 24px

  Cells:
  • Border-bottom: 1px border
  • Padding: 24px
  • Text-align: Left

  Rows:
  • Hover: Brand gradient background
  • Transition: Smooth (0.15s)
}
```

---

## Notification System

```jsx
/* Container */
.notification-container {
  • Position: Fixed
  • Top: 16px
  • Right: 16px
  • Max-width: 400px
  • Z-index: 9999

/* Notification Card */
.notification {
  • Gradient panel background
  • Border: 1px border
  • Rounded: 14px
  • Padding: 24px
  • Shadow: Large
  • Backdrop-filter: Blur(8px)
  • Animation: Slide right 0.3s
  • Flex layout: Icon + Content

  /* Variants */
  success: Green left border
  error:   Red left border
  warning: Amber left border
  info:    Blue left border

  Icon:
  • Font-size: 20px
  • Color: Matches variant
  • Flex-shrink: 0

  Content:
  • Flex: 1
  • Title: Bold, smaller text
  • Message: Secondary text

  Close Button:
  • Background: None
  • Border: None
  • Font-size: 18px
  • Hover: Color change
}
```

---

## Responsive Breakpoints

```css
/* Mobile First */
Default: < 480px

/* Tablet */
768px and up:
• Grid: 2-3 columns
• Padding: Adjusted
• Touch targets: 44px+

/* Desktop */
1024px and up:
• Grid: 3-4+ columns
• Full spacing system
• Hover effects enabled
• Smooth transitions

/* Large Desktop */
1400px+:
• Max-content-width: 1400px
• Full featured layouts
• All animations enabled
```

---

## Animation Timings

```
Fast (0.15s):
• Button hover color
• Text color change
• Border color change

Normal (0.2s):
• Standard transitions
• Focus states
• Subtle movements

Smooth (0.25s):
• Modal entrance
• Card appearance
• Page transitions

Slow (0.3s):
• Progress bars
• Important animations
• Large transitions

Entrance (0.4s):
• Page load (fade-in)
• Card load (slide-up)
• Hero section

Continuous:
• Spinner: 1s infinite
• Pulse: 1.5s infinite
```

---

## Best Practices

### ✅ DO

- Use design tokens for all colors/spacing
- Maintain consistent spacing (8px base)
- Add smooth transitions to interactive elements
- Use semantic HTML
- Test on mobile devices
- Keep component sizes reasonable
- Use clear, descriptive labels
- Provide visual feedback for actions
- Follow the color system
- Use proper contrast ratios

### ❌ DON'T

- Mix unit systems (stick to design tokens)
- Hardcode colors (use CSS variables)
- Create animations without purpose
- Ignore mobile responsiveness
- Use poor contrast colors
- Skip hover states on interactive elements
- Add too many different shadows
- Use more than 2 different border-radius values
- Create cluttered interfaces
- Forget about loading states

---

## Example Usage

### Using a Button

```jsx
import Button from "./components/Button";

<Button variant="primary" size="large" onClick={handleClick}>
  Create Exam
</Button>;
```

### Using a Card

```jsx
import Card from "./components/Card";

<Card
  title="Exam Title"
  subtitle="Created 2 days ago"
  headerAction={<button>Edit</button>}
>
  <p>Card content goes here</p>
</Card>;
```

### Using a Modal

```jsx
import Modal from "./components/Modal";

<Modal
  isOpen={showModal}
  title="Add Question"
  size="medium"
  onClose={() => setShowModal(false)}
>
  {/* Modal content */}
</Modal>;
```

### Using Utilities

```jsx
// Spacing
<div className="p-8 mt-4 mb-8">Content</div>

// Text
<h2 className="text-2xl font-bold text-brand">Title</h2>

// Grid
<div className="grid grid-3 gap-4">
  {/* Items */}
</div>

// Flexbox
<div className="flex items-center justify-between gap-4">
  {/* Items */}
</div>
```

---

**This modern UI/UX design is now live and ready for production use!**
