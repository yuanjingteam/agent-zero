# Lumen Edge — AI-Native Learning Platform Design System

> "Serious learning, deep thinking, engineering excellence."

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design Tokens](#2-design-tokens)
3. [Typography System](#3-typography-system)
4. [Layout Grid](#4-layout-grid)
5. [Component Library](#5-component-library)
6. [Surface & Elevation](#6-surface--elevation)
7. [Motion System](#7-motion-system)
8. [Iconography](#8-iconography)
9. [Page Architecture](#9-page-architecture)

---

## 1. Design Philosophy

### Core Principles

| Principle | Expression |
|---|---|
| **Precision** | Every pixel is intentional. No decorative elements without function. |
| **Restraint** | Use luminance, not saturation. Depth through layering, not color. |
| **Intelligence** | The interface should feel aware — contextual, adaptive, quietly helpful. |
| **Trust** | Stable layouts, predictable interactions, no dark patterns. |
| **Craft** | Dashboard-grade alignment. Engineering-quality spacing. |

### What We Are

- Linear's spatial discipline
- Vercel's typographic clarity
- OpenAI's quiet intelligence
- Raycast's command-oriented efficiency
- Stripe's data density
- JetBrains' developer credibility

### What We Are Not

- Not a marketing site (no hero carousels, no "Sign Up Now!" CTAs)
- Not a gaming platform (no neon, no particle effects)
- Not a social network (no vanity metrics, no infinite scroll)
- Not a design portfolio (form follows function, always)

---

## 2. Design Tokens

### 2.1 Color Palette

#### Surface Colors (Dark Theme — Primary)

```
--surface-000:    #0A0A0C    /* Deepest base — page background */
--surface-100:    #111114    /* Primary card surface */
--surface-200:    #18181C    /* Elevated card / hover state */
--surface-300:    #1F1F24    /* Active state / pressed */
--surface-400:    #28282E    /* Borders / dividers */
```

#### Text Colors

```
--text-primary:   #F0F0F2    /* Headings, primary content */
--text-secondary: #A0A0A8    /* Body text, descriptions */
--text-tertiary:  #6B6B74    /* Captions, metadata */
--text-disabled:  #45454D    /* Disabled / placeholder */
```

#### Accent Colors

```
--accent-primary:    #E8E8EC    /* Cool white — primary actions */
--accent-hover:      #FFFFFF    /* Hover state */
--accent-muted:      #3A3A42    /* Muted accent for subtle emphasis */
--accent-ice:        #B8C4D0    /* Ice blue — data visualization, links */
--accent-ice-dim:    #8A9AAD    /* Dimmed ice blue */
```

#### Semantic Colors

```
--color-success:     #4ADE80    /* Muted green — completion, success */
--color-success-dim: #22543D    /* Success background */
--color-warning:     #FBBF24    /* Amber — warnings, in-progress */
--color-warning-dim: #422006    /* Warning background */
--color-error:       #F87171    /* Soft red — errors, destructive */
--color-error-dim:   #450A0A    /* Error background */
--color-info:        #60A5FA    /* Soft blue — information */
--color-info-dim:    #1E3A5F    /* Info background */
```

#### Glow & Illumination

```
--glow-subtle:       rgba(255, 255, 255, 0.03)    /* Card edge glow */
--glow-medium:       rgba(255, 255, 255, 0.06)    /* Hover edge glow */
--glow-accent:       rgba(184, 196, 208, 0.08)    /* Accent glow */
--illumination-soft: radial-gradient(ellipse at 50% 100%, rgba(255, 255, 255, 0.04) 0%, transparent 70%)
--illumination-card: radial-gradient(ellipse at 50% 120%, rgba(255, 255, 255, 0.06) 0%, transparent 60%)
```

#### Light Theme (Optional Override)

```
--surface-000:    #FAFAFA
--surface-100:    #FFFFFF
--surface-200:    #F5F5F5
--surface-300:    #EBEBEB
--surface-400:    #D4D4D8
--text-primary:   #111111
--text-secondary: #52525B
--text-tertiary:  #A1A1AA
```

### 2.2 Spacing Scale

```
--space-0:    0px
--space-1:    4px
--space-2:    8px
--space-3:    12px
--space-4:    16px
--space-5:    20px
--space-6:    24px
--space-8:    32px
--space-10:   40px
--space-12:   48px
--space-16:   64px
--space-20:   80px
--space-24:   96px
--space-32:   128px
```

### 2.3 Border Radius

```
--radius-sm:    6px     /* Buttons, inputs, small cards */
--radius-md:    10px    /* Cards, panels */
--radius-lg:    16px    /* Modals, large containers */
--radius-full:  9999px  /* Avatars, pills, badges */
```

### 2.4 Border Tokens

```
--border-hairline:   1px solid rgba(255, 255, 255, 0.06)
--border-subtle:     1px solid rgba(255, 255, 255, 0.08)
--border-medium:     1px solid rgba(255, 255, 255, 0.12)
--border-glow:       1px solid rgba(184, 196, 208, 0.15)
```

### 2.5 Shadow & Elevation

```
--shadow-sm:    0 1px 2px rgba(0, 0, 0, 0.3)
--shadow-md:    0 4px 12px rgba(0, 0, 0, 0.4)
--shadow-lg:    0 8px 24px rgba(0, 0, 0, 0.5)
--shadow-xl:    0 16px 48px rgba(0, 0, 0, 0.6)
```

---

## 3. Typography System

### Font Stack

```
--font-display:  'Space Grotesk', 'Inter', system-ui, sans-serif
--font-body:     'Inter', 'Space Grotesk', system-ui, sans-serif
--font-mono:     'JetBrains Mono', 'Fira Code', 'SF Mono', monospace
```

### Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `display-xl` | 56px | 600 | 1.05 | -0.02em | Hero headlines |
| `display-lg` | 44px | 600 | 1.1 | -0.02em | Section headlines |
| `display-md` | 36px | 600 | 1.15 | -0.01em | Page titles |
| `heading-lg` | 28px | 600 | 1.25 | -0.01em | Card titles |
| `heading-md` | 22px | 600 | 1.3 | -0.005em | Subsection titles |
| `heading-sm` | 18px | 500 | 1.4 | 0 | Card subtitles |
| `body-lg` | 16px | 400 | 1.6 | 0 | Primary body text |
| `body-md` | 14px | 400 | 1.5 | 0.01em | Secondary body text |
| `body-sm` | 13px | 400 | 1.5 | 0.01em | Captions, metadata |
| `label-lg` | 12px | 500 | 1.4 | 0.06em | Uppercase labels |
| `label-sm` | 11px | 500 | 1.4 | 0.08em | Micro labels, tags |
| `mono-md` | 14px | 400 | 1.6 | 0 | Code blocks |
| `mono-sm` | 12px | 400 | 1.5 | 0.02em | Inline code, terminal |

### Typography Rules

1. **Headings** use `Space Grotesk` — geometric, technical, authoritative
2. **Body text** uses `Inter` — optimized for screen readability
3. **Code** uses `JetBrains Mono` — developer-native
4. **Micro-labels** are `UPPERCASE` with increased letter-spacing
5. **Maximum line width**: 680px for body content, unlimited for dashboards
6. **Paragraph spacing**: `--space-4` (16px) between paragraphs

---

## 4. Layout Grid

### 12-Column Grid

```
Columns:    12
Gutter:     24px
Margin:     auto (max 1440px container)
```

### Breakpoints

```
--bp-sm:   640px     /* Mobile landscape */
--bp-md:   768px     /* Tablet */
--bp-lg:   1024px    /* Desktop */
--bp-xl:   1280px    /* Large desktop */
--bp-2xl:  1440px    /* Max container */
```

### Grid Application

| Context | Columns Used | Gutter |
|---|---|---|
| Full-page layout | 12 | 24px |
| Content area (with sidebar) | 9 | 24px |
| Card grid (3-up) | 4 each | 24px |
| Card grid (2-up) | 6 each | 24px |
| Dashboard widgets | 3–6 each | 24px |

### Container Widths

```
--container-sm:   640px
--container-md:   768px
--container-lg:   1024px
--container-xl:   1280px
--container-2xl:  1440px
```

---

## 5. Component Library

### 5.1 Buttons

#### Primary Button

```
Background:     --accent-primary (#E8E8EC)
Text:           --surface-000 (#0A0A0C)
Border:         none
Radius:         --radius-sm (6px)
Padding:        10px 20px
Font:           --body-md, weight 500
Height:         40px

Hover:          --accent-hover (#FFFFFF), subtle shadow
Active:         scale(0.98)
Disabled:       opacity 0.4
```

#### Secondary Button

```
Background:     transparent
Text:           --text-primary
Border:         --border-subtle
Radius:         --radius-sm
Padding:        10px 20px
Height:         40px

Hover:          --surface-200 background, --border-medium
```

#### Ghost Button

```
Background:     transparent
Text:           --text-secondary
Border:         none
Padding:        8px 12px

Hover:          --surface-200 background, --text-primary
```

#### Destructive Button

```
Background:     --color-error
Text:           white
Border:         none

Hover:          lighten 10%
```

#### Button Sizes

| Size | Height | Padding | Font |
|---|---|---|---|
| `sm` | 32px | 6px 14px | --body-sm |
| `md` | 40px | 10px 20px | --body-md |
| `lg` | 48px | 14px 28px | --body-lg |

### 5.2 Input Fields

```
Background:     --surface-100
Border:         --border-hairline
Radius:         --radius-sm
Padding:        10px 14px
Height:         40px
Font:           --body-md
Text:           --text-primary
Placeholder:    --text-disabled

Focus:          --border-glow, subtle ring (2px --glow-accent)
Error:          --color-error border
Disabled:       opacity 0.5
```

#### Search Input

```
Same as input, plus:
Icon:           Search icon (left), --text-tertiary
Shortcut hint:  Right-aligned ⌘K badge
```

#### Textarea

```
Same styling, min-height: 120px
Resize:         vertical only
```

### 5.3 Cards

#### Standard Card

```
Background:     --surface-100
Border:         --border-hairline
Radius:         --radius-md (10px)
Padding:        --space-6 (24px)
Illumination:   --illumination-card (bottom radial glow)

Hover:          --surface-200, --border-subtle, shadow-md
```

#### Stat Card

```
Same as standard card, plus:
Top-left:       Uppercase label (--label-sm, --text-tertiary)
Center:         Large number (--display-md, --text-primary)
Bottom:         Trend indicator (arrow + percentage)
```

#### Course Card

```
Background:     --surface-100
Border:         --border-hairline
Radius:         --radius-md
Padding:        0 (image flush to edges on top)
Image area:     Top 60%, object-fit cover, top radius matches card
Content area:   --space-6 padding
Tags:           Pill badges (see Badges)
Title:          --heading-sm
Description:    --body-sm, --text-secondary, 2-line clamp
Footer:         Progress bar + metadata row
```

#### Glass Card (Elevated)

```
Background:     rgba(17, 17, 20, 0.8)
Backdrop:       blur(12px)
Border:         --border-subtle
Shadow:         --shadow-lg
```

### 5.4 Navigation

#### Top Navigation Bar

```
Height:         64px
Background:     rgba(10, 10, 12, 0.9)
Backdrop:       blur(16px) saturate(1.5)
Border-bottom:  --border-hairline
Position:       sticky, top 0, z-50
Content:        Logo (left) | Nav links (center) | User menu (right)
```

#### Sidebar Navigation

```
Width:          240px (collapsible to 64px)
Background:     --surface-100
Border-right:   --border-hairline
Items:          40px height, --body-md
Active item:    --surface-200 background, left accent bar (2px --accent-primary)
Icons:          20px, --text-tertiary (active: --text-primary)
```

#### Breadcrumbs

```
Separator:      "/" icon, --text-disabled
Current:        --text-primary
Previous:       --text-tertiary, hover: --text-secondary
Font:           --body-sm
```

### 5.5 Badges & Tags

#### Status Badge

```
Height:         22px
Padding:        2px 10px
Radius:         --radius-full
Font:           --label-sm, uppercase
```

| State | Background | Text |
|---|---|---|
| Completed | --color-success-dim | --color-success |
| In Progress | --color-warning-dim | --color-warning |
| Not Started | --surface-300 | --text-tertiary |
| Error | --color-error-dim | --color-error |

#### Tag Pill

```
Height:         24px
Padding:        2px 10px
Radius:         --radius-full
Background:     --surface-300
Text:           --text-secondary, --body-sm
Border:         none
```

### 5.6 Progress Indicators

#### Progress Bar

```
Height:         4px
Background:     --surface-300
Fill:           --accent-primary
Radius:         --radius-full
Animation:      width transition 300ms ease-out
```

#### Circular Progress

```
Size:           48px (small), 80px (medium), 120px (large)
Stroke:         3px
Track:          --surface-300
Fill:           --accent-primary
Center text:    Percentage in --mono-sm
```

### 5.7 Modals & Dialogs

```
Overlay:        rgba(0, 0, 0, 0.7), backdrop-blur(4px)
Container:      --surface-100, --radius-lg, max-width 560px
Header:         --heading-md, --space-6 padding
Body:           --body-md, --space-6 padding
Footer:         --space-6 padding, right-aligned actions
Border:         --border-subtle
Shadow:         --shadow-xl
Animation:      fade-in + scale(0.97 → 1.0), 200ms ease-out
```

### 5.8 Tooltips

```
Background:     --surface-200
Text:           --text-primary, --body-sm
Border:         --border-subtle
Radius:         --radius-sm
Padding:        6px 12px
Shadow:         --shadow-md
Max-width:      280px
Animation:      fade-in, 150ms
```

### 5.9 Dropdown Menu

```
Background:     --surface-100
Border:         --border-subtle
Radius:         --radius-md
Padding:        4px
Shadow:         --shadow-lg
Item height:    36px
Item padding:   8px 12px
Item hover:     --surface-200
Separator:      1px --surface-300, margin 4px 0
```

### 5.10 Tabs

```
Container:      border-bottom --border-hairline
Tab height:     40px
Tab padding:    0 16px
Font:           --body-md, --text-tertiary
Active:         --text-primary, bottom border 2px --accent-primary
Hover:          --text-secondary
Gap:            0 (tabs touch)
```

### 5.11 Code Block

```
Background:     --surface-000
Border:         --border-hairline
Radius:         --radius-md
Padding:        --space-5
Font:           --mono-md
Line height:    1.7
Syntax theme:   Custom muted (no neon colors)
Header bar:     --surface-100, file name + copy button
```

### 5.12 Avatar

```
Sizes:          24px, 32px, 40px, 48px, 64px
Radius:         --radius-full
Border:         2px --surface-100 (for stacking)
Fallback:       Initials on --surface-300 background
Status dot:     8px circle, bottom-right offset
```

### 5.13 Skeleton Loader

```
Background:     --surface-200
Shimmer:        linear-gradient(90deg, transparent 0%, --surface-300 50%, transparent 100%)
Animation:      shimmer 1.5s infinite
Radius:         matches target component
```

---

## 6. Surface & Elevation

### Elevation Layers

```
Level 0:  --surface-000  — Page background
Level 1:  --surface-100  — Cards, panels, sidebar
Level 2:  --surface-200  — Hover states, active items
Level 3:  --surface-300  — Pressed states, input focus
Level 4:  Glass card     — Modals, floating panels (backdrop-blur)
```

### Radial Illumination Pattern

Cards use a subtle bottom-illuminated radial gradient to create depth:

```css
.card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    ellipse 80% 50% at 50% 100%,
    rgba(255, 255, 255, 0.04) 0%,
    transparent 70%
  );
  pointer-events: none;
}
```

### Edge Glow Effect

Interactive elements get a subtle luminous border on hover:

```css
.interactive:hover {
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 0 20px rgba(255, 255, 255, 0.02);
}
```

---

## 7. Motion System

### Timing Functions

```
--ease-default:   cubic-bezier(0.25, 0.1, 0.25, 1)
--ease-in:        cubic-bezier(0.4, 0, 1, 1)
--ease-out:       cubic-bezier(0, 0, 0.2, 1)
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1)  /* Use sparingly */
```

### Duration Scale

```
--duration-fast:    100ms    /* Micro-interactions: toggle, checkbox */
--duration-normal:  200ms    /* Standard transitions: hover, focus */
--duration-slow:    300ms    /* Layout changes: expand, collapse */
--duration-enter:   250ms    /* Elements entering view */
--duration-exit:    200ms    /* Elements leaving view */
```

### Motion Rules

1. **No bounce** — spring easing only for very specific cases (tooltips)
2. **No dramatic animation** — no slide-in-from-bottom page transitions
3. **Fade is preferred** — opacity transitions for most state changes
4. **Scale sparingly** — only on button press (0.98) and modal enter (0.97→1)
5. **Reduce motion** — respect `prefers-reduced-motion: reduce`

### Standard Transitions

| Element | Property | Duration | Easing |
|---|---|---|---|
| Button hover | background, shadow | 200ms | ease-out |
| Card hover | background, border, shadow | 200ms | ease-out |
| Input focus | border, ring | 200ms | ease-out |
| Modal enter | opacity, transform | 250ms | ease-out |
| Modal exit | opacity, transform | 200ms | ease-in |
| Dropdown open | opacity, transform | 150ms | ease-out |
| Tab switch | color, border | 200ms | ease-out |
| Progress bar | width | 300ms | ease-out |
| Toast enter | opacity, transform | 200ms | ease-out |
| Page transition | opacity | 200ms | ease-out |

---

## 8. Iconography

### Icon System

- **Library**: Lucide Icons (consistent stroke style)
- **Stroke width**: 1.5px
- **Default size**: 20px
- **Color**: Inherits from `currentColor`

### Size Scale

| Size | Pixels | Usage |
|---|---|---|
| `xs` | 14px | Inline text icons |
| `sm` | 16px | Buttons, badges |
| `md` | 20px | Navigation, cards (default) |
| `lg` | 24px | Feature icons, empty states |
| `xl` | 32px | Hero sections, onboarding |

### Key Icons for Learning Platform

```
Navigation:     Home, BookOpen, Map, BarChart3, Users, Settings, Search
Learning:       Play, Pause, CheckCircle2, Clock, Award, Target, Zap
AI:             Sparkles, Bot, MessageSquare, Lightbulb, Brain
Content:        FileText, Code2, Video, Headphones, Download
Social:         Heart, MessageCircle, Share2, UserPlus, Star
Actions:        ChevronRight, ChevronDown, ArrowRight, ExternalLink, Copy
Status:         Circle, CheckCircle2, AlertCircle, XCircle, Info
```

---

## 9. Page Architecture

### 9.1 Home Page

**Purpose**: Entry point — orient the learner, surface what matters.

```
┌─────────────────────────────────────────────────────────────┐
│  Top Navigation Bar (64px)                                  │
│  [Logo]    [Dashboard] [Courses] [Roadmap] [Community]   [User] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  HERO AREA                                          │    │
│  │                                                     │    │
│  │  "Continue Learning"                                │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │    │
│  │  │ Stat Card│ │ Stat Card│ │ Stat Card│            │    │
│  │  │ Courses  │ │ Hours    │ │ Streak   │            │    │
│  │  │   12     │ │   48h    │ │   7d     │            │    │
│  │  └──────────┘ └──────────┘ └──────────┘            │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐       │    │
│  │  │  AI Insight Card (Glass)                 │       │    │
│  │  │  "Based on your progress, focus on..."   │       │    │
│  │  │  [View Roadmap →]                        │       │    │
│  │  └──────────────────────────────────────────┘       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  CONTINUE LEARNING                     [See All →]  │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │    │
│  │  │Course  │ │Course  │ │Course  │ │Course  │       │    │
│  │  │Card    │ │Card    │ │Card    │ │Card    │       │    │
│  │  │60% done│ │30% done│ │80% done│ │10% done│       │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  LEARNING PATHS                     [Explore →]     │    │
│  │  ┌──────────────────┐ ┌──────────────────┐          │    │
│  │  │  AI Engineer     │ │  Full Stack       │          │    │
│  │  │  Path            │ │  Path             │          │    │
│  │  │  ████████░░ 80%  │ │  ████░░░░░ 40%   │          │    │
│  │  │  8 courses       │ │  12 courses       │          │    │
│  │  └──────────────────┘ └──────────────────┘          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  AI TOOLS                                            │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │    │
│  │  │Tutor   │ │Code    │ │Quiz    │ │Summary │       │    │
│  │  │AI      │ │Review  │ │Gen     │ │AI      │       │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────┐ ┌─────────────────────────────┐    │
│  │  RECENT ACTIVITY    │ │  COMMUNITY HIGHLIGHTS       │    │
│  │  • Completed Ch.3   │ │  ┌──────────────────────┐   │    │
│  │  • Earned badge     │ │  │ Discussion thread    │   │    │
│  │  • 2h study streak  │ │  │ "Best practices..."  │   │    │
│  └─────────────────────┘ └─────────────────────────────┘    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Footer                                                     │
└─────────────────────────────────────────────────────────────┘
```

#### Hero Area Content

- **Greeting**: "Good morning, [Name]" — context-aware time greeting
- **Stats Row**: 3 stat cards — active courses, total hours, current streak
- **AI Insight Card**: Glass card with personalized learning recommendation
- **Featured Roadmap**: Current learning path with progress visualization

#### Section Details

| Section | Cards | Content |
|---|---|---|
| Continue Learning | 4-up horizontal scroll | Course cards with progress bars |
| Learning Paths | 2-up grid | Path cards with completion % |
| AI Tools | 4-up grid | Tool cards with icon + description |
| Recent Activity | List | Timeline of learning events |
| Community Highlights | List | Top discussions, student achievements |

---

### 9.2 Course Library

**Purpose**: Browse and discover courses with powerful filtering.

```
┌─────────────────────────────────────────────────────────────┐
│  Top Navigation Bar                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  COURSE LIBRARY                                             │
│  Browse 200+ courses in AI, engineering, and design.        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  [Search courses...]           [Filters ▾]          │    │
│  │                                                     │    │
│  │  Tags: [All] [AI/ML] [Backend] [Frontend] [DevOps] │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Sort: [Popular ▾]  │  Showing 24 of 200 courses           │
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐                          │
│  │ Course │ │ Course │ │ Course │                          │
│  │ Card   │ │ Card   │ │ Card   │                          │
│  │        │ │        │ │        │                          │
│  │ Level  │ │ Level  │ │ Level  │                          │
│  │ Rating │ │ Rating │ │ Rating │                          │
│  │ Hours  │ │ Hours  │ │ Hours  │                          │
│  └────────┘ └────────┘ └────────┘                          │
│  ┌────────┐ ┌────────┐ ┌────────┐                          │
│  │ Course │ │ Course │ │ Course │                          │
│  │ Card   │ │ Card   │ │ Card   │                          │
│  └────────┘ └────────┘ └────────┘                          │
│                                                             │
│  [Load More]  or  Infinite scroll                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Footer                                                     │
└─────────────────────────────────────────────────────────────┘
```

#### Filter Panel (Sidebar or Top)

```
Categories:     AI/ML, Backend, Frontend, DevOps, Design, Data
Level:          Beginner, Intermediate, Advanced
Duration:       < 2h, 2–5h, 5–10h, 10h+
Status:         Not Started, In Progress, Completed
Rating:         4+ stars
```

#### Course Card Content

- Thumbnail image (gradient placeholder for missing images)
- Course title (max 2 lines)
- Instructor name + avatar
- Level badge
- Duration estimate
- Star rating + review count
- Progress bar (if enrolled)
- "Enroll" or "Continue" CTA

---

### 9.3 Course Detail

**Purpose**: Full course information, curriculum, and enrollment.

```
┌─────────────────────────────────────────────────────────────┐
│  Top Navigation Bar                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ← Back to Library                                          │
│                                                             │
│  ┌─────────────────────────────┐ ┌───────────────────────┐  │
│  │                             │ │                       │  │
│  │  COURSE TITLE               │ │  ┌─────────────────┐  │  │
│  │  Large display heading      │ │  │  Video Preview  │  │  │
│  │                             │ │  │  or Thumbnail   │  │  │
│  │  Short description text     │ │  │                 │  │  │
│  │  that explains what the     │ │  └─────────────────┘  │  │
│  │  student will learn.        │ │                       │  │
│  │                             │ │  [Enroll — Free]      │  │
│  │  ┌────┐ ┌────┐ ┌────┐     │ │  [Add to Roadmap]     │  │  │
│  │  │ AI │ │Cert│ │Comm│     │ │                       │  │  │
│  │  └────┘ └────┘ └────┘     │ │  ┌─────────────────┐  │  │  │
│  │                             │ │  │ Instructor      │  │  │  │
│  │  Level: Intermediate        │ │  │ [Avatar] Name   │  │  │  │
│  │  Duration: 12 hours         │ │  │ Bio excerpt     │  │  │  │
│  │  Rating: ★★★★★ 4.9 (340)   │ │  └─────────────────┘  │  │  │
│  │  Students: 2,840            │ │                       │  │  │
│  │                             │ │  ┌─────────────────┐  │  │  │
│  └─────────────────────────────┘ │  │ What You'll     │  │  │  │
│                                  │  │ Learn           │  │  │  │
│  ┌─────────────────────────────┐ │  │ • Point 1       │  │  │  │
│  │  TABS                       │ │  │ • Point 2       │  │  │  │
│  │  [Curriculum] [Reviews]     │ │  │ • Point 3       │  │  │  │
│  │  [Discussion] [Resources]   │ │  └─────────────────┘  │  │  │
│  ├─────────────────────────────┤ └───────────────────────┘  │
│  │                             │                            │
│  │  Module 1: Introduction     │                            │
│  │  ┌─────────────────────┐   │                            │
│  │  │ 1.1 Welcome         │   │                            │
│  │  │ 1.2 Setup           │   │                            │
│  │  │ 1.3 First Steps     │   │                            │
│  │  └─────────────────────┘   │                            │
│  │                             │                            │
│  │  Module 2: Core Concepts    │                            │
│  │  ┌─────────────────────┐   │                            │
│  │  │ 2.1 Architecture    │   │                            │
│  │  │ 2.2 Patterns        │   │                            │
│  │  └─────────────────────┘   │                            │
│  │                             │                            │
│  └─────────────────────────────┘                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Footer                                                     │
└─────────────────────────────────────────────────────────────┘
```

#### Tab Content

| Tab | Content |
|---|---|
| **Curriculum** | Expandable module list with lesson titles, duration, completion status |
| **Reviews** | Star distribution chart + individual reviews with helpful votes |
| **Discussion** | Q&A threads specific to this course |
| **Resources** | Downloadable materials, links, references |

---

### 9.4 Learning Dashboard

**Purpose**: Command center for active learning — progress, goals, activity.

```
┌─────────────────────────────────────────────────────────────┐
│  Top Navigation Bar                                         │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  Sidebar     │  DASHBOARD                                   │
│              │  Welcome back, [Name]                        │
│  ─ Dashboard │                                              │
│  ─ Courses   │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  ─ Roadmap   │  │ Courses  │ │ Hours    │ │ Streak   │     │
│  ─ Progress  │  │ Enrolled │ │ This Week│ │ Current  │     │
│  ─ Community │  │    8     │ │   12h    │ │   14d    │     │
│  ─ AI Tutor  │  │          │ │  ↑ 20%   │ │          │     │
│              │  └──────────┘ └──────────┘ └──────────┘     │
│  ─ Settings  │                                              │
│              │  ┌──────────────────────────────────────┐    │
│              │  │  WEEKLY ACTIVITY                     │    │
│              │  │  Bar chart — hours per day            │    │
│              │  │  Mon Tue Wed Thu Fri Sat Sun          │    │
│              │  │  ██  ███ █   ██  ████ █   ░          │    │
│              │  └──────────────────────────────────────┘    │
│              │                                              │
│              │  ┌─────────────────┐ ┌───────────────────┐   │
│              │  │ CURRENT GOALS   │ │ ACTIVE COURSES     │   │
│              │  │                 │ │                    │   │
│              │  │ ○ Complete Ch.5 │ │ ┌────────────────┐ │   │
│              │  │ ● Finish quiz   │ │ │ Course Card    │ │   │
│              │  │ ○ 3h practice   │ │ │ 60% ████░░░░   │ │   │
│              │  │                 │ │ └────────────────┘ │   │
│              │  │ [Add Goal]      │ │ ┌────────────────┐ │   │
│              │  │                 │ │ │ Course Card    │ │   │
│              │  │                 │ │ │ 30% ███░░░░░░  │ │   │
│              │  │                 │ │ └────────────────┘ │   │
│              │  └─────────────────┘ └───────────────────┘   │
│              │                                              │
│              │  ┌──────────────────────────────────────┐    │
│              │  │  AI RECOMMENDATION                   │    │
│              │  │  "Based on your pace, you'll finish  │    │
│              │  │   the AI Engineer path by July 15."  │    │
│              │  │  [Adjust Plan →]                     │    │
│              │  └──────────────────────────────────────┘    │
│              │                                              │
├──────────────┴──────────────────────────────────────────────┤
│  Footer                                                     │
└─────────────────────────────────────────────────────────────┘
```

#### Dashboard Widgets

| Widget | Data | Refresh |
|---|---|---|
| Stat Cards (3) | Enrolled courses, weekly hours, streak | Real-time |
| Weekly Activity Chart | Bar chart, 7 days | Daily |
| Current Goals | Checklist with add/remove | Real-time |
| Active Courses | Course cards with progress | On navigation |
| AI Recommendation | Personalized insight | Session-based |

---

### 9.5 AI Learning Assistant

**Purpose**: Conversational AI tutor for questions, code review, explanations.

```
┌─────────────────────────────────────────────────────────────┐
│  Top Navigation Bar                                         │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  Sidebar     │  AI LEARNING ASSISTANT                       │
│              │                                              │
│  ─ New Chat  │  ┌──────────────────────────────────────┐    │
│              │  │                                      │    │
│  History:    │  │  Welcome! I'm your AI learning       │    │
│  ─ Python    │  │  assistant. I can help you:          │    │
│    basics    │  │                                      │    │
│  ─ React     │  │  • Understand complex concepts       │    │
│    hooks     │  │  • Review and debug code             │    │
│  ─ API       │  │  • Generate practice quizzes         │    │
│    design    │  │  • Explain with examples             │    │
│              │  │                                      │    │
│              │  │  Try asking:                         │    │
│              │  │  ┌────────────────────────────┐      │    │
│              │  │  │ "Explain closures in JS"   │      │    │
│              │  │  └────────────────────────────┘      │    │
│              │  │  ┌────────────────────────────┐      │    │
│              │  │  │ "Review my async function" │      │    │
│              │  │  └────────────────────────────┘      │    │
│              │  │  ┌────────────────────────────┐      │    │
│              │  │  │ "Quiz me on React hooks"   │      │    │
│              │  │  └────────────────────────────┘      │    │
│              │  │                                      │    │
│              │  └──────────────────────────────────────┘    │
│              │                                              │
│              │  ┌──────────────────────────────────────┐    │
│              │  │  [Attach □]  Ask anything...   [→]  │    │
│              │  └──────────────────────────────────────┘    │
│              │                                              │
├──────────────┴──────────────────────────────────────────────┤
│  Footer                                                     │
└─────────────────────────────────────────────────────────────┘
```

#### Chat Message Styles

```
User message:
  Background:     --surface-200
  Radius:         --radius-md (bottom-right: 2px — speech bubble)
  Max-width:      70%
  Alignment:      right

AI message:
  Background:     --surface-100
  Radius:         --radius-md (bottom-left: 2px)
  Max-width:      85%
  Alignment:      left
  Code blocks:    Syntax highlighted, copy button
  Markdown:       Full support
```

#### AI Assistant Capabilities

| Capability | Trigger | Output |
|---|---|---|
| Concept Explanation | "Explain X" | Structured explanation with examples |
| Code Review | Paste code | Line-by-line feedback with suggestions |
| Quiz Generation | "Quiz me on X" | Interactive multiple-choice questions |
| Debug Help | Paste error | Step-by-step debugging guidance |
| Summarize | "Summarize lesson X" | Key points and takeaways |

---

### 9.6 Learning Roadmap

**Purpose**: Visual path through a learning journey with milestones.

```
┌─────────────────────────────────────────────────────────────┐
│  Top Navigation Bar                                         │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  Sidebar     │  LEARNING ROADMAP                            │
│              │  AI Engineer Path                            │
│  Paths:      │  ████████████░░░░░░ 65% complete             │
│  ─ AI Eng    │                                              │
│  ─ Full Stack│  ┌──────────────────────────────────────┐    │
│  ─ DevOps    │  │                                      │    │
│              │  │  ● ─── ─── ─── ─── ─── ─── ─── ───  │    │
│              │  │  │                                  │    │
│              │  │  ◉ Fundamentals         ✓ Complete  │    │
│              │  │  │  Python Basics        4h         │    │
│              │  │  │  Data Structures      6h         │    │
│              │  │  │                                  │    │
│              │  │  ◉ Machine Learning      ✓ Complete  │    │
│              │  │  │  Linear Algebra       8h         │    │
│              │  │  │  Supervised Learning  10h        │    │
│              │  │  │  Neural Networks      12h        │    │
│              │  │  │                                  │    │
│              │  │  ◉ Deep Learning         ○ Active    │    │
│              │  │  │  CNNs                 8h         │    │
│              │  │  │  Transformers         10h        │    │
│              │  │  │  Fine-tuning          6h         │    │
│              │  │  │                                  │    │
│              │  │  ○ LLM Engineering       ○ Locked    │    │
│              │  │  │  Prompt Engineering   4h         │    │
│              │  │  │  RAG Systems          8h         │    │
│              │  │  │  Agent Design         10h        │    │
│              │  │  │                                  │    │
│              │  │  ○ Production             ○ Locked    │    │
│              │  │     Deployment           8h         │    │
│              │  │     Monitoring           4h         │    │
│              │  │                                      │    │
│              │  └──────────────────────────────────────┘    │
│              │                                              │
│              │  ┌──────────────────────────────────────┐    │
│              │  │  AI SUGGESTION                       │    │
│              │  │  "You're 65% through. Based on your  │    │
│              │  │   pace, focus on Transformers next." │    │
│              │  │  [Start Lesson →]                    │    │
│              │  └──────────────────────────────────────┘    │
│              │                                              │
├──────────────┴──────────────────────────────────────────────┤
│  Footer                                                     │
└─────────────────────────────────────────────────────────────┘
```

#### Roadmap States

| State | Visual | Interaction |
|---|---|---|
| **Completed** | Filled circle, checkmark, full opacity | Click to review |
| **Active** | Filled circle, pulsing subtle glow | Click to continue |
| **Available** | Empty circle, full opacity | Click to start |
| **Locked** | Empty circle, dimmed opacity | Tooltip explains prerequisites |

---

### 9.7 Progress Analytics

**Purpose**: Data-rich view of learning patterns, achievements, and growth.

```
┌─────────────────────────────────────────────────────────────┐
│  Top Navigation Bar                                         │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  Sidebar     │  PROGRESS ANALYTICS                          │
│              │                                              │
│  ─ Overview  │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  ─ Skills    │  │ Total    │ │ Courses  │ │ Skills   │     │
│  ─ History   │  │ Hours    │ │Complete  │ │ Unlocked │     │
│  ─ Goals     │  │  156h    │ │    12    │ │    24    │     │
│              │  │ ↑ 15%    │ │ ↑ 3      │ │ ↑ 6      │     │
│              │  └──────────┘ └──────────┘ └──────────┘     │
│              │                                              │
│              │  ┌──────────────────────────────────────┐    │
│              │  │  LEARNING OVER TIME                  │    │
│              │  │  Area chart — hours per week          │    │
│              │  │  Last 12 weeks                        │    │
│              │  │  ╭─────╮                              │    │
│              │  │ ╭╯     ╰──╮                           │    │
│              │  │╭╯          ╰──╮                       │    │
│              │  │╯               ╰────────              │    │
│              │  └──────────────────────────────────────┘    │
│              │                                              │
│              │  ┌─────────────────┐ ┌───────────────────┐   │
│              │  │ SKILL BREAKDOWN │ │ TOPICS            │   │
│              │  │                 │ │                    │   │
│              │  │ Radar chart     │ │ Horizontal bars    │   │
│              │  │                 │ │                    │   │
│              │  │ Python    ████  │ │ AI/ML      ██████  │   │
│              │  │ ML        ███   │ │ Backend    ████    │   │
│              │  │ Deep L    ██    │ │ Frontend   ██      │   │
│              │  │ LLM       █     │ │ DevOps     █       │   │
│              │  │                 │ │                    │   │
│              │  └─────────────────┘ └───────────────────┘   │
│              │                                              │
│              │  ┌──────────────────────────────────────┐    │
│              │  │  ACHIEVEMENTS                        │    │
│              │  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐        │    │
│              │  │  │ 🏆 │ │ 🎯 │ │ 🔥 │ │ ⭐ │        │    │
│              │  │  │7day│ │Quiz│ │10h │ │Top │        │    │
│              │  │  │str │ │Mas │ │day │ │3%  │        │    │
│              │  │  └────┘ └────┘ └────┘ └────┘        │    │
│              │  └──────────────────────────────────────┘    │
│              │                                              │
├──────────────┴──────────────────────────────────────────────┤
│  Footer                                                     │
└─────────────────────────────────────────────────────────────┘
```

#### Chart Specifications

| Chart | Library | Style |
|---|---|---|
| Learning Over Time | Area chart | Filled area, --accent-ice color, subtle grid |
| Skill Breakdown | Radar chart | Single filled polygon, --accent-ice stroke |
| Topic Distribution | Horizontal bar | --accent-primary bars, labels left |
| Weekly Activity | Bar chart | --surface-300 track, --accent-primary fill |

#### Achievement System

- **Streak Badges**: 7-day, 30-day, 100-day
- **Milestone Badges**: First course, 10 courses, 50 hours
- **Skill Badges**: Complete a learning path
- **Community Badges**: First answer, helpful answer (10+ votes)

---

### 9.8 Community & Discussion

**Purpose**: Peer learning, Q&A, knowledge sharing.

```
┌─────────────────────────────────────────────────────────────┐
│  Top Navigation Bar                                         │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  Sidebar     │  COMMUNITY                                   │
│              │                                              │
│  ─ All       │  [Search discussions...]     [New Post +]    │
│  ─ Questions │                                              │
│  ─ Discuss   │  Tags: [All] [Questions] [Showcase] [Tips]   │
│  ─ Showcase  │                                              │
│  ─ Tips      │  ┌──────────────────────────────────────┐    │
│              │  │  HOT DISCUSSIONS                     │    │
│  My Posts:   │  │                                      │    │
│  ─ Bookmarked│  │  How to handle token limits in       │    │
│  ─ My Qs     │  │  long conversations?                 │    │
│              │  │  24 answers · 156 views · 2h ago      │    │
│              │  │  Tags: [LLM] [Context] [Tips]         │    │
│              │  ├──────────────────────────────────────┤    │
│              │  │  Share your RAG pipeline architecture │    │
│              │  │  18 answers · 340 views · 5h ago      │    │
│              │  │  Tags: [RAG] [Architecture] [Showcase]│    │
│              │  ├──────────────────────────────────────┤    │
│              │  │  Best practices for fine-tuning       │    │
│              │  │  small language models                │    │
│              │  │  31 answers · 520 views · 1d ago      │    │
│              │  │  Tags: [Fine-tuning] [SLM] [Question] │    │
│              │  └──────────────────────────────────────┘    │
│              │                                              │
│              │  ┌──────────────────────────────────────┐    │
│              │  │  ACTIVE LEARNERS                     │    │
│              │  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐        │    │
│              │  │  │ AV │ │ AV │ │ AV │ │ AV │        │    │
│              │  │  └────┘ └────┘ └────┘ └────┘        │    │
│              │  │  142 online now                       │    │
│              │  └──────────────────────────────────────┘    │
│              │                                              │
├──────────────┴──────────────────────────────────────────────┤
│  Footer                                                     │
└─────────────────────────────────────────────────────────────┘
```

#### Post Detail View

```
┌──────────────────────────────────────────┐
│  ← Back to Community                     │
│                                          │
│  POST TITLE                              │
│  Author avatar · Name · 2h ago           │
│  Tags: [Tag1] [Tag2]                     │
│                                          │
│  Post body with markdown rendering...    │
│  Code blocks, images, links.             │
│                                          │
│  ┌──────┐ ┌────────┐ ┌──────────┐       │
│  │ 42 ↑ │ │ 💬 24  │ │ 🔖 Save  │       │
│  └──────┘ └────────┘ └──────────┘       │
│                                          │
│  ─────────────────────────────────────── │
│  24 ANSWERS                              │
│                                          │
│  ┌──────────────────────────────────────┐│
│  │ Accepted ✓                           ││
│  │ Author · 1h ago                      ││
│  │                                      ││
│  │ Answer body...                       ││
│  │                                      ││
│  │ 15 ↑ · Reply                        ││
│  └──────────────────────────────────────┘│
│                                          │
│  ┌──────────────────────────────────────┐│
│  │ Your Answer                          ││
│  │ ┌──────────────────────────────────┐ ││
│  │ │ Write your answer...             │ ││
│  │ │ (Markdown supported)             │ ││
│  │ └──────────────────────────────────┘ ││
│  │                          [Post →]    ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

---

### 9.9 User Profile

**Purpose**: Personal identity, learning history, settings.

```
┌─────────────────────────────────────────────────────────────┐
│  Top Navigation Bar                                         │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  Sidebar     │  PROFILE                                     │
│              │                                              │
│  ─ Overview  │  ┌──────────────────────────────────────┐    │
│  ─ Activity  │  │                                      │    │
│  ─ Badges    │  │  ┌──────┐  Display Name              │    │
│  ─ Settings  │  │  │      │  @username                  │    │
│              │  │  │ AV   │  AI Engineer · Joined Mar   │    │
│              │  │  │ 64px │  2024                        │    │
│              │  │  │      │                              │    │
│              │  │  └──────┘  [Edit Profile]              │    │
│              │  │                                      │    │
│              │  └──────────────────────────────────────┘    │
│              │                                              │
│              │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│              │  │ Courses  │ │ Hours    │ │ Badges   │     │
│              │  │ Complete │ │ Learned  │ │ Earned   │     │
│              │  │   12     │ │  156h    │ │    8     │     │
│              │  └──────────┘ └──────────┘ └──────────┘     │
│              │                                              │
│              │  TABS: [Activity] [Badges] [Certificates]    │
│              │                                              │
│              │  ┌──────────────────────────────────────┐    │
│              │  │  RECENT ACTIVITY                     │    │
│              │  │                                      │    │
│              │  │  Today                               │    │
│              │  │  • Completed "Transformer Architecture│    │
│              │  │    Deep Dive" lesson                  │    │
│              │  │  • Scored 92% on Module 3 quiz        │    │
│              │  │                                      │    │
│              │  │  Yesterday                           │    │
│              │  │  • Earned "Week Warrior" badge        │    │
│              │  │  • Started "Advanced RAG" course      │    │
│              │  │                                      │    │
│              │  └──────────────────────────────────────┘    │
│              │                                              │
│              │  ┌──────────────────────────────────────┐    │
│              │  │  BADGES                              │    │
│              │  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐        │    │
│              │  │  │Icon│ │Icon│ │Icon│ │Icon│        │    │
│              │  │  │Name│ │Name│ │Name│ │Name│        │    │
│              │  │  │Date│ │Date│ │Date│ │Date│        │    │
│              │  │  └────┘ └────┘ └────┘ └────┘        │    │
│              │  └──────────────────────────────────────┘    │
│              │                                              │
├──────────────┴──────────────────────────────────────────────┤
│  Footer                                                     │
└─────────────────────────────────────────────────────────────┘
```

#### Settings Page

```
Sections:
  ─ Account:    Name, email, password, delete account
  ─ Profile:    Avatar, bio, social links, visibility
  ─ Learning:   Daily goal, reminder notifications, preferred topics
  ─ AI:         Assistant personality, response length, code style
  ─ Appearance: Theme (dark/light), font size, language
  ─ Privacy:    Profile visibility, activity sharing, data export
```

---

## 10. Responsive Behavior

### Mobile (< 768px)

- Sidebar collapses to hamburger menu
- Card grids become single column
- Navigation becomes bottom tab bar
- Hero stats stack vertically
- AI chat goes full-screen

### Tablet (768px – 1024px)

- Sidebar collapses to icon-only (64px)
- Card grids become 2-column
- Top navigation remains
- Charts maintain readability

### Desktop (> 1024px)

- Full sidebar (240px)
- 3-4 column card grids
- All widgets visible
- Side-by-side layouts

---

## 11. Accessibility

### Requirements

- **WCAG 2.1 AA** compliance minimum
- **Contrast ratios**: 4.5:1 for body text, 3:1 for large text
- **Focus indicators**: Visible 2px ring on all interactive elements
- **Keyboard navigation**: Full tab order, arrow keys for menus
- **Screen reader**: Proper ARIA labels, landmarks, live regions
- **Reduced motion**: Respect `prefers-reduced-motion`

### Focus Ring Style

```css
:focus-visible {
  outline: 2px solid var(--accent-ice);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

---

## 12. Implementation Notes

### Recommended Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Styling | Tailwind CSS + CSS Variables |
| Components | Radix UI primitives |
| Icons | Lucide React |
| Charts | Recharts or Visx |
| Animations | Framer Motion |
| Fonts | Google Fonts (Space Grotesk, Inter, JetBrains Mono) |

### Tailwind Config Extension

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#0A0A0C',
          1: '#111114',
          2: '#18181C',
          3: '#1F1F24',
          4: '#28282E',
        },
        text: {
          primary: '#F0F0F2',
          secondary: '#A0A0A8',
          tertiary: '#6B6B74',
          disabled: '#45454D',
        },
        accent: {
          primary: '#E8E8EC',
          hover: '#FFFFFF',
          muted: '#3A3A42',
          ice: '#B8C4D0',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
      },
    },
  },
}
```

### CSS Custom Properties

```css
:root {
  /* Surfaces */
  --surface-000: #0A0A0C;
  --surface-100: #111114;
  --surface-200: #18181C;
  --surface-300: #1F1F24;
  --surface-400: #28282E;

  /* Text */
  --text-primary: #F0F0F2;
  --text-secondary: #A0A0A8;
  --text-tertiary: #6B6B74;
  --text-disabled: #45454D;

  /* Accent */
  --accent-primary: #E8E8EC;
  --accent-hover: #FFFFFF;
  --accent-ice: #B8C4D0;

  /* Glow */
  --glow-subtle: rgba(255, 255, 255, 0.03);
  --glow-medium: rgba(255, 255, 255, 0.06);
  --glow-accent: rgba(184, 196, 208, 0.08);

  /* Illumination */
  --illumination-card: radial-gradient(
    ellipse 80% 50% at 50% 120%,
    rgba(255, 255, 255, 0.06) 0%,
    transparent 60%
  );

  /* Motion */
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --ease-default: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
}
```

---

## Design Checklist

Before shipping any screen, verify:

- [ ] All surfaces use the correct elevation layer
- [ ] Cards have bottom radial illumination
- [ ] Borders are hairline weight (1px, 6-8% white)
- [ ] Typography follows the scale (no arbitrary sizes)
- [ ] Micro-labels are uppercase with increased letter-spacing
- [ ] Spacing uses the 4px grid
- [ ] Interactive elements have 200ms transitions
- [ ] No saturated colors or gradients
- [ ] Focus rings are visible on all interactive elements
- [ ] Contrast ratios meet WCAG AA
- [ ] Layout works at all breakpoints
- [ ] Motion respects `prefers-reduced-motion`

---

*Design System v1.0 — Lumen Edge Learning Platform*
