import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Signal, input, output } from '@angular/core';

export interface DataTableColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  formatter?: (row: T) => string;
}

export interface DataTableAction<T = Record<string, unknown>> {
  action: string;
  label: string;
  variant?: 'primary' | 'danger' | 'ghost';
  icon?: string;
  disableWhen?: (row: T) => boolean;
}

@Component({
  selector: 'ui-data-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-wrapper">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              @for (column of columns(); track column.key) {
                <th [style.width]="column.width" [class]="'align-' + (column.align || 'left')">
                  {{ column.label }}
                </th>
              }
              @if (actions().length) {
                <th class="actions-header">Actions</th>
              }
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              <tr>
                <td [attr.colspan]="columns().length + (actions().length ? 1 : 0)">
                  <div class="state loading">Loading records...</div>
                </td>
              </tr>
            } @else if (!data().length) {
              <tr>
                <td [attr.colspan]="columns().length + (actions().length ? 1 : 0)">
                  <div class="state empty">{{ emptyState() }}</div>
                </td>
              </tr>
            } @else {
              @for (row of data(); track trackBy($index, row)) {
                <tr (click)="handleRowClick(row)" [class.clickable]="enableRowHover()">
                  @for (column of columns(); track column.key) {
                    <td [class]="'align-' + (column.align || 'left')">
                      {{ resolveCell(row, column) }}
                    </td>
                  }
                  @if (actions().length) {
                    <td class="actions-cell" (click)="$event.stopPropagation()">
                      @for (action of actions(); track action.action) {
                        <button
                          type="button"
                          [disabled]="action.disableWhen?.(row)"
                          [class]="'action-btn ' + (action.variant || 'ghost')"
                          (click)="handleAction(action.action, row)"
                        >
                          @if (action.icon) {
                            <span class="material-symbols-outlined">{{ action.icon }}</span>
                          }
                          {{ action.label }}
                        </button>
                      }
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table-wrapper {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #fff;
      overflow: hidden;
    }

    .table-scroll {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
    }

    thead {
      background: #f8fafc;
    }

    th, td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    th {
      text-align: left;
      font-weight: 600;
      font-size: 0.85rem;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    td {
      color: #1e293b;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .align-center {
      text-align: center;
    }

    .align-right {
      text-align: right;
    }

    .actions-header,
    .actions-cell {
      width: 140px;
      text-align: right;
    }

    .actions-cell {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .action-btn {
      border: none;
      border-radius: 6px;
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
      cursor: pointer;
      transition: background 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .action-btn.ghost {
      background: transparent;
      color: #2563eb;
    }

    .action-btn.primary {
      background: #2563eb;
      color: #fff;
    }

    .action-btn.danger {
      background: #dc2626;
      color: #fff;
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    tr.clickable {
      cursor: pointer;
    }

    tr.clickable:hover {
      background: #f8fafc;
    }

    .state {
      text-align: center;
      padding: 1.5rem 0;
      color: #475569;
    }

    .state.loading {
      font-style: italic;
    }
  `]
})
export class DataTableComponent<T extends Record<string, unknown> = Record<string, unknown>> {
  columns = input.required<DataTableColumn<T>[]>();
  data = input<T[]>([]);
  actions = input<DataTableAction<T>[]>([]);
  loading = input(false);
  emptyState = input('No records to display.');
  enableRowHover = input(true);
  trackKey = input<string>('id');

  rowClick = output<T>();
  actionClick = output<{ action: string; row: T }>();

  protected trackBy = (index: number, row: T) => {
    const key = this.trackKey();
    return (row?.[key as keyof T] as unknown) ?? index;
  };

  protected resolveCell(row: T, column: DataTableColumn<T>): string {
    if (column.formatter) {
      return column.formatter(row);
    }
    const key = column.key as keyof T;
    const value = row?.[key];
    return value === null || value === undefined ? '—' : String(value);
  }

  protected handleRowClick(row: T) {
    if (!this.enableRowHover()) {
      return;
    }
    this.rowClick.emit(row);
  }

  protected handleAction(action: string, row: T) {
    this.actionClick.emit({ action, row });
  }
}

