import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

export interface TreeViewAction {
  action: string;
  label: string;
  icon?: string;
  variant?: 'ghost' | 'danger' | 'primary';
}

export interface TreeViewNode<T = unknown> {
  id: string | number;
  label: string;
  description?: string;
  badge?: string;
  meta?: T;
  children?: TreeViewNode<T>[];
}

@Component({
  selector: 'ui-tree-node',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="node" [style.paddingLeft.px]="level() * 16">
      <button
        type="button"
        class="toggle"
        *ngIf="node().children?.length"
        (click)="toggle()"
      >
        {{ expanded() ? '−' : '+' }}
      </button>
      <div class="content" (click)="select.emit(node())">
        <div class="label">{{ node().label }}</div>
        @if (node().description) {
          <div class="description">{{ node().description }}</div>
        }
        @if (node().badge) {
          <span class="badge">{{ node().badge }}</span>
        }
      </div>
      <div class="actions" (click)="$event.stopPropagation()" *ngIf="actions().length">
        @for (action of actions(); track action.action) {
          <button
            type="button"
            [class]="'action-btn ' + (action.variant || 'ghost')"
            (click)="actionClick.emit({ action: action.action, node: node() })"
          >
            @if (action.icon) {
              <span class="material-symbols-outlined">{{ action.icon }}</span>
            }
            {{ action.label }}
          </button>
        }
      </div>
    </div>

    @if (node().children?.length && expanded()) {
      <div class="children">
        @for (child of node().children!; track child.id) {
          <ui-tree-node
            [node]="child"
            [level]="level() + 1"
            [actions]="actions()"
            (select)="select.emit($event)"
            (actionClick)="actionClick.emit($event)"
          />
        }
      </div>
    }
  `,
  styles: [`
    .node {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.5rem 0.25rem;
    }

    .toggle {
      border: none;
      background: #e2e8f0;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      line-height: 1;
    }

    .content {
      flex: 1;
      cursor: pointer;
    }

    .label {
      font-weight: 600;
      color: #0f172a;
    }

    .description {
      font-size: 0.85rem;
      color: #475569;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      background: #e0e7ff;
      color: #312e81;
      font-size: 0.75rem;
      border-radius: 999px;
      padding: 0.1rem 0.5rem;
      margin-top: 0.25rem;
    }

    .actions {
      display: flex;
      gap: 0.25rem;
    }

    .action-btn {
      border: none;
      border-radius: 6px;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      cursor: pointer;
      background: transparent;
    }

    .action-btn.ghost {
      color: #2563eb;
    }

    .action-btn.danger {
      color: #dc2626;
    }

    .action-btn.primary {
      color: #0f172a;
      font-weight: 600;
    }

    .children {
      margin-left: 1.75rem;
      border-left: 1px solid #e2e8f0;
      padding-left: 0.75rem;
    }
  `]
})
export class UiTreeNodeComponent<T = unknown> {
  node = input.required<TreeViewNode<T>>();
  level = input(0);
  actions = input<TreeViewAction[]>([]);

  select = output<TreeViewNode<T>>();
  actionClick = output<{ action: string; node: TreeViewNode<T> }>();

  protected expanded = signal(false);

  toggle() {
    this.expanded.update(value => !value);
  }
}

@Component({
  selector: 'ui-tree-view',
  standalone: true,
  imports: [CommonModule, UiTreeNodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tree-view">
      @if (title()) {
        <div class="tree-header">
          <div>
            <h3>{{ title() }}</h3>
            @if (subtitle()) {
              <p>{{ subtitle() }}</p>
            }
          </div>
        </div>
      }
      <div class="tree-body">
        @for (node of nodes(); track node.id) {
          <ui-tree-node
            [node]="node"
            [level]="0"
            [actions]="actions()"
            (select)="nodeSelect.emit($event)"
            (actionClick)="nodeAction.emit($event)"
          />
        }
        @if (!nodes().length) {
          <div class="empty-state">
            {{ emptyState() }}
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .tree-view {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #fff;
    }

    .tree-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .tree-header h3 {
      margin: 0;
      font-size: 1.05rem;
    }

    .tree-header p {
      margin: 0.25rem 0 0;
      color: #475569;
      font-size: 0.9rem;
    }

    .tree-body {
      padding: 0.75rem 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 1rem;
      color: #94a3b8;
      font-style: italic;
    }
  `]
})
export class TreeViewComponent<T = unknown> {
  title = input<string | null>(null);
  subtitle = input<string | null>(null);
  nodes = input<TreeViewNode<T>[]>([]);
  actions = input<TreeViewAction[]>([]);
  emptyState = input('No items available.');

  nodeSelect = output<TreeViewNode<T>>();
  nodeAction = output<{ action: string; node: TreeViewNode<T> }>();
}

