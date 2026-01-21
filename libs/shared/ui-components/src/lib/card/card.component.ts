import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="cardClasses">
      @if (title()) {
        <div class="card-header">
          <h3>{{ title() }}</h3>
        </div>
      }
      <div class="card-body">
        <ng-content></ng-content>
      </div>
      @if (footer()) {
        <div class="card-footer">
          <ng-content select="[footer]"></ng-content>
        </div>
      }
    </div>
  `,
  styles: [`
    .card {
      border-radius: 0.5rem;
      overflow: hidden;
      transition: box-shadow 0.3s;
    }
    
    .card-elevated {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                  0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .card-elevated:hover {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
                  0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    
    .card-outlined {
      border: 1px solid #e0e0e0;
    }
    
    .card-header {
      padding: 1rem 1.5rem;
      background-color: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .card-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #212121;
    }
    
    .card-body {
      padding: 1.5rem;
      background-color: white;
    }
    
    .card-footer {
      padding: 1rem 1.5rem;
      background-color: #fafafa;
      border-top: 1px solid #e0e0e0;
    }
  `]
})
export class CardComponent {
  title = input<string>();
  variant = input<'elevated' | 'outlined'>('elevated');
  footer = input<boolean>(false);

  get cardClasses(): string {
    return `card card-${this.variant()}`;
  }
}

