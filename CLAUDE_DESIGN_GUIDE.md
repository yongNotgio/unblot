# Design Guide Template for Migration

Use this document as a reusable design brief for migrating an app while preserving its visual identity. Replace bracketed placeholders with the target product details before handing it to another model or designer.

## Goal

The app should feel like a deliberate, cohesive product with a clear visual system. The design should prioritize readability, consistency, and a strong brand identity over generic UI patterns.

When migrating the app, preserve the following priorities:

- [Primary product principle]
- [Secondary product principle]
- Bold, high-contrast layouts
- Tactile press-style interactions
- [Typography pairing]
- [Corner geometry style]
- [Surface and texture treatment]

## Design Identity

The current design direction is [design direction], not [anti-patterns to avoid].

### Core traits

- [Border and outline treatment]
- [Surface treatment]
- [Primary text and border color]
- [Accent color for actions and emphasis]
- [Corner style and layout rhythm]
- [Heading typography]
- [UI typography]
- [Cursor behavior]
- [Texture or grain treatment]

### What the design should feel like

- [Metaphor or product feeling]
- [Interaction feeling]
- [Reading or browsing mood]
- [What the UI should not overpower]

## Color System

Use a palette that reflects the product brand and supports contrast, accessibility, and hierarchy.

### Primary palette

- Primary text: `[hex]`
- Background: `[hex]`
- Surface: `[hex]`
- Accent: `[hex]`
- Secondary accent: `[hex]`
- Shadow color: `[hex]`

### Usage rules

- Use primary text color for body copy, borders, and structural elements
- Use background color for page-level surfaces
- Use surface color for cards, panels, and containers
- Use accent color for primary calls to action and active states
- Use secondary accent sparingly for highlights or status markers
- Avoid styles that conflict with the intended brand language

## Typography System

The typography is a core part of the brand.

### Fonts

- Headings and titles: [font family]
- UI and body controls: [font family]
- Primary content: [font family]

### Rules

- Use bold headings for section titles and hero text
- Use a distinct font treatment for UI labels, tags, and nav items
- Keep primary content readable with generous line height
- Do not let the UI typography compete with content typography
- Avoid overly decorative combinations that reduce clarity

### Hierarchy

- Hero and featured headings should feel prominent and intentional
- Section titles should be strong and legible at a glance
- UI text should be compact and functional
- Main content should remain calm, spacious, and easy to scan

## Layout Principles

The app uses a structured SPA layout with a consistent navigation pattern and content panels.

### Global layout

- Fixed navigation on desktop
- Main content area aligned to the primary nav
- Single-column reading focus for detail pages
- Cards and widgets arranged in clear blocks, not floating panels
- Consistent spacing rhythm across views

### Spatial behavior

- Keep large blocks aligned to a simple grid
- Use clear separation between navigation, content, and utility areas
- Avoid decorative asymmetry unless it serves hierarchy
- Let content breathe, but keep the structure disciplined

### Responsiveness

- Collapse or condense navigation for smaller screens
- Preserve the same visual identity on mobile, just with simpler stacking
- Keep tap targets large enough for touch use
- Maintain readable content typography on narrow screens

## Motion and Interaction

The motion language should feel tactile, not smooth and floaty.

### Interaction style

- Buttons should feel pressed rather than floating or glowing
- Active states should move down and inward
- Hover states should reinforce the core geometry of the UI
- Links and controls should feel like part of a coherent system

### Motion rules

- Keep animations short and deliberate
- Use subtle fade-in or slide-in for page transitions
- Use minimal easing and short durations
- Avoid motion that feels playful unless the brand calls for it
- Avoid large blur-based transitions


## Surface and Texture

Texture is important because it keeps the brutalist look from feeling flat.

### Required surface treatment

- Add a subtle noise overlay across the page if the brand supports texture
- Use opaque surfaces instead of translucent layers unless translucency is intentional
- Use strong, visible borders where the design calls for structure
- Prefer flat fills over overly complex gradients

### Shadows

- Shadows should be blocky and offset if the system uses depth
- Buttons and cards should appear grounded rather than floating
- Avoid soft blur shadows as the dominant treatment unless the brand requires them

## Component Library

This app should be migrated with a consistent set of reusable components.

### Navigation

- Fixed navigation on desktop
- Brand mark at the top
- Primary creation or action button clearly visible
- Navigation items styled consistently with the brand system
- Active item should be clearly defined with contrast or structure

### Buttons

Primary button style should feel like a 3D pressable object.

Rules:
- Sharp corners when the brand calls for it
- Thick border or otherwise clear structural emphasis
- Heavy offset shadow or equivalent depth cue
- Clear, concise label treatment
- Strong hover or press feedback

Button variants:

- Primary accent-filled action button
- Dark primary button
- Outline button
- Secondary muted button

### Inputs and textareas

- Use solid bordered inputs
- Use the brand's corner treatment consistently
- Avoid glow-heavy focus states unless intentionally part of the system
- Focus should feel deliberate and accessible
- Keep labels compact and clear

### Cards

- Cards should be solid blocks with borders or equivalent structure
- Use layout-first structure rather than decorative framing
- Keep content cards readable and balanced
- Include metadata, title, preview, tags, and action row in a stable hierarchy
- Cards should not rely on translucent backgrounds unless that is part of the brand

### Tags and badges

- Tags should look like printed labels or pills with clear edges
- Status badges should be clearly marked and easy to spot
- Keep label text short and consistent with the brand tone

### Modal dialogs

- Use strong borders and clear structure
- Avoid soft shadows and blurred backdrops as the main style unless intentional
- Put actions in a clear footer row
- Keep dialog content compact and readable

## Page Templates

### Home

The home page should include:

- A bold hero section with a large headline
- A stat line showing key product metrics
- Primary CTA to begin the core action
- Secondary CTA to explore or browse
- A contextual sidebar widget if needed
- A content feed or primary listing underneath

Visual rule:
- Hero content should feel editorial and confident, not marketing-driven

### Discover

The discovery page should feel like a catalog or archive.

- Search and filter tools should be visible and functional
- The content grid should support browsing quickly
- Sorting and view toggles should remain simple
- Discovery should emphasize scanning and comparison

### Trending

- Use the same card language as discovery
- Emphasize ranking or popularity clearly
- Make the sorting logic understandable through the UI

### Collections

- Collections should feel like organized shelves or folders
- Strong section headers and clear grouping matter more than decoration
- Saved content should remain easy to scan

### View Poem

The single content detail page should be the most reading-focused view.

- Keep the content centered and comfortable to read
- Use a wide content block with ample line height
- Display author or ownership information clearly when needed
- Place key actions in a concise action row
- Comments or related responses should sit below with clear separators

### Add Poem and Edit Poem

- Forms should feel like composed creation spaces
- Keep title, content, tags, and media sections clearly separated
- The primary text area should be visually prominent
- Publishing or saving action should be visually dominant
- Cancel should be clearly secondary

### Login, Register, Reset

- Auth screens should remain consistent with the main design language
- Keep them simple, centered, and readable
- Avoid generic auth-panel styling that breaks the brand

### Admin

- Admin should still follow the core design system
- Content management must stay utilitarian and structured
- Clarity matters more than visual polish

## Data and Content Presentation

### Anonymous identity

- Use the product's identity rules consistently in all public-facing areas
- Avoid exposing personal identity unless the product explicitly requires it
- If an identifier is needed, derive a stable label from the user id or account record

### Poem presentation

- Preserve line breaks and spacing
- Keep content legible at a comfortable reading width
- Use the primary content typography for the main body
- Keep metadata visually quieter than the main content

### Imagery

- Images should be framed as part of the content, not the primary decoration
- Preserve aspect ratios cleanly
- Use image previews with strong edges and clear containment

## Migration Rules for Claude

When Claude rebuilds or restyles this app, follow these rules:

1. Preserve the overall layout logic and navigation structure.
2. Replace soft UI language with the chosen brand's core visual language.
3. Keep content typography and UI typography distinct.
4. Keep all key actions obvious and tactile.
5. Use the chosen palette consistently across the system.
6. Keep any intentional cursor, texture, border, or depth treatments.
7. Do not introduce rounded cards, glass blur, or generic dashboard styling unless the brand calls for it.
8. Do not hide the primary content behind excessive decorative chrome.
9. Make the design responsive without losing the brand identity on mobile.
10. Preserve the product's identity rules in every public-facing view.

## Implementation References

Replace these references with the actual files in the target app:

- `[main shell file] contains the core CSS variables, cursor, texture, and layout rules`
- `[home or landing view] defines the hero and card structure`
- `[detail view] defines the reading layout and action row`
- `[create or edit view] defines the writing form layout and upload flow`

## Quick Style Checklist

Before shipping any migrated screen, confirm:

- The screen uses the intended palette rather than soft gradients
- Corners match the brand system
- Buttons provide clear press or hover feedback
- Typography matches the document's font hierarchy
- The page feels specific to the brand, not generic
- The primary content remains the visual center
- Identity rules are preserved
- The screen works on desktop and mobile

## One-Line Design Summary

This product should look like a deliberate, brand-specific interface: cohesive, tactile, readable, and built to let the primary content dominate the experience.
