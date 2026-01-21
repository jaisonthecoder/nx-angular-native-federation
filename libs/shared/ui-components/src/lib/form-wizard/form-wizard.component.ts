import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Signal, computed, input, output, signal } from '@angular/core';

export interface WizardStep {
  title: string;
  description?: string;
  optional?: boolean;
}

@Component({
  selector: 'ui-form-wizard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wizard">
      <div class="wizard-steps">
        @for (step of steps(); track step.title; let idx = $index) {
          <button
            type="button"
            class="wizard-step"
            [class.active]="idx === currentStep()"
            [class.complete]="idx < currentStep()"
            (click)="handleStepClick(idx)"
            [disabled]="!allowNavigation() && idx !== currentStep()"
          >
            <span class="index">{{ idx + 1 }}</span>
            <span>
              <span class="title">{{ step.title }}</span>
              @if (step.description) {
                <span class="description">{{ step.description }}</span>
              }
              @if (step.optional) {
                <span class="optional">Optional</span>
              }
            </span>
          </button>
        }
      </div>

      <div class="wizard-content">
        <ng-content />
      </div>

      <div class="wizard-controls">
        <button type="button" (click)="previous()" [disabled]="currentStep() === 0">
          Back
        </button>
        <button
          type="button"
          (click)="next()"
          [disabled]="currentStep() === lastIndex()"
        >
          Next
        </button>
      </div>
    </div>
  `,
  styles: [`
    .wizard {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #fff;
    }

    .wizard-steps {
      display: flex;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      flex-wrap: wrap;
    }

    .wizard-step {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border: 1px solid transparent;
      border-radius: 999px;
      padding: 0.35rem 0.9rem;
      background: transparent;
      cursor: pointer;
      transition: border 0.2s ease, background 0.2s ease;
    }

    .wizard-step .index {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #e2e8f0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .wizard-step .title {
      font-weight: 600;
      display: block;
      text-align: left;
    }

    .wizard-step .description {
      font-size: 0.8rem;
      color: #475569;
    }

    .wizard-step .optional {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .wizard-step.active {
      border-color: #2563eb;
      background: #eff6ff;
    }

    .wizard-step.active .index {
      background: #2563eb;
      color: #fff;
    }

    .wizard-step.complete .index {
      background: #22c55e;
      color: #fff;
    }

    .wizard-content {
      padding: 1.5rem;
    }

    .wizard-controls {
      display: flex;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .wizard-controls button {
      border: none;
      border-radius: 8px;
      padding: 0.6rem 1.25rem;
      cursor: pointer;
      background: #e2e8f0;
      font-weight: 600;
    }

    .wizard-controls button:last-child {
      background: #2563eb;
      color: #fff;
    }

    .wizard-controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class FormWizardComponent {
  steps = input.required<WizardStep[]>();
  currentStep = input(0);
  allowNavigation = input(true);

  stepChange = output<number>();
  nextClick = output<void>();
  previousClick = output<void>();

  protected lastIndex: Signal<number> = computed(() => Math.max(0, this.steps().length - 1));

  previous() {
    const nextIndex = Math.max(0, this.currentStep() - 1);
    this.previousClick.emit();
    this.stepChange.emit(nextIndex);
  }

  next() {
    const nextIndex = Math.min(this.lastIndex(), this.currentStep() + 1);
    this.nextClick.emit();
    this.stepChange.emit(nextIndex);
  }

  handleStepClick(index: number) {
    if (!this.allowNavigation()) {
      return;
    }
    this.stepChange.emit(index);
  }
}

