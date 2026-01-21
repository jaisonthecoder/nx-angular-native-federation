import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  badge?: number;
  isExpanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  @Output() collapseChange = new EventEmitter<boolean>();

  menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'home',
      route: '/home'
    },
    {
      id: 'licensing',
      label: 'Licensing Services',
      icon: 'clipboard',
      isExpanded: true,
      children: [
        {
          id: 'lpco-cnca',
          label: 'LPCO CNCA',
          icon: 'file-text',
          route: '/lpco-cnca-app'
        },
        {
          id: 'minocom',
          label: 'MINOCOM',
          icon: 'radio',
          route: '/minocom'
        },
        {
          id: 'anecla',
          label: 'ANECLA',
          icon: 'truck',
          route: '/anecla'
        }
      ]
    },
    {
      id: 'inspection',
      label: 'Inspection & Clearance',
      icon: 'search',
      children: [
        {
          id: 'inspections',
          label: 'Inspections',
          icon: 'clipboard-check',
          route: '/inspections'
        },
        {
          id: 'clearances',
          label: 'Clearances',
          icon: 'check-circle',
          route: '/clearances'
        }
      ]
    },
    {
      id: 'air',
      label: 'Air',
      icon: 'plane',
      route: '/air'
    },
    {
      id: 'land',
      label: 'Land',
      icon: 'map',
      route: '/land'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      route: '/settings'
    }
  ];

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.collapseChange.emit(this.isCollapsed);
  }

  toggleMenuItem(item: MenuItem): void {
    if (item.children) {
      item.isExpanded = !item.isExpanded;
    }
  }

  getIconPath(iconName: string): string {
    const icons: Record<string, string> = {
      'home': 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
      'clipboard': 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2',
      'file-text': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
      'radio': 'M5 16v2 M19 16v2 M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M18.364 5.636l-1.414 1.414M6.05 6.05L4.636 4.636 M18.364 18.364l-1.414-1.414M6.05 17.95l-1.414 1.414 M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
      'truck': 'M16 3h4a1 1 0 0 1 1 1v8m-5-4h5M1 11h11v7H1z M7 15.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z M17 15.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z',
      'search': 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35',
      'clipboard-check': 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 M9 14l2 2 4-4',
      'check-circle': 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3',
      'plane': 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z',
      'map': 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z M8 2v16 M16 6v16',
      'settings': 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'
    };
    return icons[iconName] || icons['home'];
  }
}
