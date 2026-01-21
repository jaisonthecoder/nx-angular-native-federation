import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserContextService } from '@angola-workspace/shared/auth';
import { UserContext } from '@angola-workspace/shared/models';

/**
 * Context Switcher Component
 * Allows users with multiple application/company contexts to switch between them
 */
@Component({
  selector: 'app-context-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (hasMultipleContexts()) {
      <div class="context-switcher">
        <label for="context-select">Context:</label>
        <select
          id="context-select"
          [value]="currentContextId()"
          (change)="onContextChange($event)"
          class="context-select"
        >
          @for (context of allContexts(); track context.role.id) {
            <option [value]="getContextId(context)">
              {{ context.application.name }} - {{ context.company.name }}
              ({{ context.profile.name }} / {{ context.role.name }})
            </option>
          }
        </select>
      </div>
    }
  `,
  styles: [`
    .context-switcher {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
    }

    .context-select {
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
      min-width: 300px;
    }
  `]
})
export class ContextSwitcherComponent {
  private readonly userContextService = inject(UserContextService);

  // Signals from service
  allContexts = this.userContextService.allContexts;
  currentContext = this.userContextService.currentContext;
  hasMultipleContexts = this.userContextService.hasMultipleContexts;

  // Computed current context ID
  currentContextId = computed(() => {
    const ctx = this.currentContext();
    return ctx ? this.getContextId(ctx) : '';
  });

  /**
   * Generate unique ID for context
   */
  getContextId(context: UserContext): string {
    return `${context.application.id}-${context.company.id}-${context.profile.id}-${context.role.id}`;
  }

  /**
   * Handle context change
   */
  onContextChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const contextId = select.value;

    const context = this.allContexts().find(ctx =>
      this.getContextId(ctx) === contextId
    );

    if (context) {
      this.userContextService.switchContext(context);
    }
  }
}

