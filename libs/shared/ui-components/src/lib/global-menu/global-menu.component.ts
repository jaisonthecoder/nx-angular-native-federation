import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface GlobalMenuItem {
  key: string;
  label: string;
  description?: string;
  icon?: string;
}

@Component({
  selector: 'lib-global-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="global-menu" role="navigation" aria-label="Global modules">
      <button
        type="button"
        class="menu-item"
        [class.menu-item--active]="item.key === activeKey"
        [attr.aria-pressed]="item.key === activeKey"
        *ngFor="let item of modules"
        (click)="onSelect(item.key)"
      >
        <span class="menu-item__icon" *ngIf="item.icon">{{ item.icon }}</span>
        <span class="menu-item__label">{{ item.label }}</span>
        <span class="menu-item__description" *ngIf="item.description">{{ item.description }}</span>
      </button>
    </nav>
  `,
  styles: `
    .global-menu {
      display: inline-flex;
      gap: 0.25rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 0.25rem;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
    }

    .menu-item {
      display: inline-flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      min-width: 6rem;
      padding: 0.35rem 0.6rem;
      border-radius: 0.4rem;
      border: 1px solid transparent;
      background: transparent;
      color: var(--foreground);
      font-size: 0.7rem;
      font-weight: 500;
      line-height: 1.2;
      gap: 0.1rem;
      cursor: pointer;
      transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
    }

    .menu-item__icon {
      font-size: 0.75rem;
      opacity: 0.75;
    }

    .menu-item__label {
      font-size: 0.72rem;
    }

    .menu-item__description {
      font-size: 0.65rem;
      color: rgb(115 115 115);
    }

    .menu-item:hover {
      background: rgba(37, 99, 235, 0.08);
      border-color: rgba(37, 99, 235, 0.25);
    }

    .menu-item--active {
      background: rgba(37, 99, 235, 0.15);
      border-color: rgba(37, 99, 235, 0.55);
      color: rgb(37 99 235);
    }

    .menu-item--active .menu-item__description {
      color: rgb(59 130 246);
    }

    @media (max-width: 900px) {
      .global-menu {
        width: 100%;
        overflow-x: auto;
      }

      .menu-item {
        min-width: 5rem;
      }
    }
  `
})
export class GlobalMenuComponent {
  @Input() modules: GlobalMenuItem[] = [];
  @Input() activeKey: string | null = null;
  @Output() moduleSelected = new EventEmitter<string>();

  onSelect(key: string): void {
    if (this.activeKey !== key) {
      this.moduleSelected.emit(key);
    }
  }
}

