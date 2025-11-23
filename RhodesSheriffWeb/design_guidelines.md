# Sheriff's Office Rhodes - Design Guidelines

## Design Approach
**Reference-Based**: Western law enforcement aesthetic inspired by 1899 era, combined with modern MDT (Mobile Data Terminal) panel interfaces used in police systems. Think Red Dead Redemption meets contemporary police software.

## Core Visual Theme
**Dark Western Aesthetic**
- Primary palette direction: Deep browns, warm golds, aged leather, weathered wood textures
- Authentic 1899 period aesthetic while maintaining modern usability
- Worn, historical feel without sacrificing clarity

## Layout Architecture

**MDT Panel Structure**
- **Sidebar Navigation (Left)**: Fixed 240px width on desktop, collapsible on mobile
  - Sheriff badge logo at top (placeholder div for user's logo)
  - Navigation menu items with icons
  - Current user rank display at bottom
  - Dark background with subtle texture (leather/wood grain)

- **Main Content Area (Right)**: Full remaining width
  - Header bar with page title and user info
  - Content organized in card-based sections
  - Breathing room between components

**Responsive Breakpoints**
- Desktop: Full sidebar + main content
- Tablet: Collapsible sidebar with hamburger menu
- Mobile: Bottom navigation bar, stacked cards

## Typography Hierarchy

**Font Strategy**
- Headers: Bold, serif typeface (evokes Western wanted posters) - Google Fonts: "Playfair Display" or "Crimson Text"
- Body: Clean, readable sans-serif - Google Fonts: "Inter" or "Roboto"
- Data/Tables: Monospace for alignment - "Roboto Mono"

**Sizes**
- Page Titles: text-3xl (30px)
- Section Headers: text-xl (20px)  
- Body Text: text-base (16px)
- Small Text/Labels: text-sm (14px)
- Data/Stats: text-2xl (24px) for emphasis

## Spacing System
**Tailwind Units**: Consistent use of 4, 6, 8, 12 for rhythm
- Component padding: p-6, p-8
- Section gaps: gap-6, gap-8
- Margins: mb-4, mb-8
- Card spacing: space-y-6

## Component Library

### Dashboard Cards
- Statistics cards (4-column grid on desktop, stack on mobile)
- Large numerical displays with icons
- "Active Cases", "Current Inmates", "Registered Weapons"
- Recent activity feed card with timeline visualization

### Form Components
- **Input Fields**: Full-width with labels above, border with subtle glow on focus
- **Dropdowns**: Custom-styled selects matching Western theme
- **Buttons**: 
  - Primary: Solid with gold accent
  - Secondary: Outlined
  - Danger (Delete): Clear visual distinction with confirmation
  - All buttons: px-6 py-3 rounded

### Data Tables
- Striped rows for readability
- Sticky headers on scroll
- Action buttons (View, Edit, Delete) aligned right
- **Rank-Based Visibility**: Delete buttons only show for Sheriff/Chief Deputy/Deputy Sergeant
- Hover states on rows

### Special Components
- **Countdown Timer**: Large display format (mm:ss) for jail sentences
- **Photo Upload**: Square preview with border, fallback badge icon
- **Status Badges**: Pill-shaped with colors (Open/In Progress/Closed)
- **Search Bar**: Icon left, clear button right, instant filter

### Navigation
- Icon + label format
- Active state: Gold accent bar or background highlight
- Sections: Dashboard, Case Files, Person Records, Jail, Fines, Laws, Weapons, Personnel, Notes, Audit Log

### Modal/Popup Patterns
- Case details view
- Person history overlay
- Confirmation dialogs (delete actions)
- Task assignment forms
- Semi-transparent dark backdrop

## Specialized UI Elements

**Badge/Rank Display**
- Sheriff badge icon with user's rank below
- Gold metallic treatment for higher ranks
- Visible in sidebar and profile area

**Audit Log Timeline**
- Left-aligned timestamps
- Icon indicators for action types
- Color coding: New (green), Modified (blue), Deleted (red), Status Change (gold)

**Notes Interface**
- Tabbed view: "Shared Notes" vs "My Notes"
- Card-based entries with author, timestamp
- Text area with submit button

**Weapons Registry**
- Two-tab layout: "Citizen Weapons" | "Service Weapons"
- Status dropdown with instant update + timestamp logging
- Serial number prominent display

## Images
**Sheriff Badge Logo**: Top of sidebar (150x150px placeholder) - User will replace with their custom badge
**No hero images**: This is a utility application, not a marketing page

## Interaction Patterns
- **Auto-save indicators**: Brief confirmation messages
- **Loading states**: During data operations
- **Empty states**: "No cases found" with action prompt
- **Role-based hiding**: Delete buttons, user creation forms only for authorized ranks
- **Inline editing**: Quick status changes without full forms where appropriate

## Accessibility
- Clear focus indicators (gold ring)
- Proper label associations
- Keyboard navigation throughout
- Screen reader announcements for dynamic updates (timer countdowns, new entries)
- Sufficient contrast despite dark theme (WCAG AA minimum)