# JUL Portal Shell Layout

This document describes the shell layout architecture for the JUL Portal application.

## Structure

The shell layout consists of the following components:

```
app/
├── layout/
│   ├── header/
│   │   ├── header.component.ts
│   │   ├── header.component.html
│   │   └── header.component.scss
│   ├── sidebar/
│   │   ├── sidebar.component.ts
│   │   ├── sidebar.component.html
│   │   └── sidebar.component.scss
│   ├── footer/
│   │   ├── footer.component.ts
│   │   ├── footer.component.html
│   │   └── footer.component.scss
│   ├── layout.component.ts
│   ├── layout.component.html
│   └── layout.component.scss
└── app.ts
```

## Components

### 1. Layout Component (`layout.component.ts`)
The main container component that orchestrates all layout parts.

**Features:**
- Manages sidebar collapse state
- Handles mobile menu toggling
- Provides consistent structure for all pages

### 2. Header Component (`header.component.ts`)
Top navigation bar with branding, search, and user controls.

**Features:**
- Logo and application title
- Global search bar
- Language selector
- Theme toggle
- Notifications dropdown with badge
- User profile dropdown menu
- Mobile-responsive menu toggle

**Inputs:**
- `userName`: Current user's name
- `userRole`: Current user's role

**Outputs:**
- `menuToggle`: Emitted when menu button is clicked

### 3. Sidebar Component (`sidebar.component.ts`)
Left navigation panel with menu items and sub-menus.

**Features:**
- Hierarchical navigation menu
- Expandable/collapsible menu items
- Icons for all menu items
- Badge support for notifications
- Collapse/expand functionality
- Help card at the bottom
- Mobile-responsive behavior

**Inputs:**
- `isCollapsed`: Whether sidebar is collapsed

**Outputs:**
- `collapseChange`: Emitted when collapse state changes

**Menu Structure:**
```typescript
interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  badge?: number;
  isExpanded?: boolean;
}
```

### 4. Footer Component (`footer.component.ts`)
Bottom section with copyright, links, and social media.

**Features:**
- Copyright information
- Version number display
- Quick links (Privacy, Terms, etc.)
- Social media links
- Fully responsive

## Theming

The layout uses the JUL theme system from `libs/shared/ui-components/src/theme/`.

### Color Scheme
- **Primary**: JUL Blue (#4A7FD7)
- **Secondary**: JUL Orange (#FF6B35)
- **Neutral**: Professional grays
- **Status**: Success, Warning, Error, Info colors

### CSS Variables Used
```scss
--color-primary-600      // Main brand blue
--color-secondary-500    // Accent orange
--color-neutral-*        // Gray scale
--spacing-*              // Consistent spacing
--radius-*               // Border radius values
--shadow-*               // Box shadow levels
--transition-*           // Animation timing
--header-height          // 64px
--sidebar-width          // 280px
--sidebar-collapsed-width // 64px
```

## Responsive Behavior

### Desktop (> 768px)
- Full header with search bar
- Expandable sidebar
- Footer with all links

### Mobile (≤ 768px)
- Simplified header (no search, condensed user info)
- Overlay sidebar (slides from left)
- Mobile menu overlay backdrop
- Stacked footer layout

## Usage

### In App Component

```typescript
import { LayoutComponent } from './layout/layout.component';

@Component({
  imports: [LayoutComponent],
  template: '<app-layout></app-layout>'
})
export class App {}
```

### Customizing Menu Items

Edit `sidebar.component.ts` to modify the navigation menu:

```typescript
menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'home',
    route: '/home'
  },
  {
    id: 'services',
    label: 'Services',
    icon: 'clipboard',
    children: [
      {
        id: 'service-1',
        label: 'Service 1',
        icon: 'file-text',
        route: '/service-1'
      }
    ]
  }
];
```

### Adding Custom Icons

The sidebar uses SVG paths. To add new icons, update the `getIconPath()` method:

```typescript
getIconPath(iconName: string): string {
  const icons: Record<string, string> = {
    'custom-icon': 'M12 2L2 7v10l10 5 10-5V7L12 2z',
    // ... other icons
  };
  return icons[iconName] || icons['home'];
}
```

## Accessibility

All components include:
- Proper ARIA labels
- Keyboard navigation support
- Focus management
- Screen reader friendly markup

## Future Enhancements

- [ ] Theme switcher integration
- [ ] Breadcrumb dynamic updates from router
- [ ] Real notification system
- [ ] User profile integration with auth
- [ ] Menu items from configuration/API
- [ ] Multi-language support
- [ ] Customizable layout presets
