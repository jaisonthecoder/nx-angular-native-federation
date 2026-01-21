import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      [class]="buttonClasses"
      [disabled]="disabled"
      (click)="handleClick($event)">
      {{ label }}
    </button>
  `,
  styles: [`
    button {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background-color: #3f51b5;
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background-color: #303f9f;
    }
    
    .btn-secondary {
      background-color: #757575;
      color: white;
    }
    
    .btn-secondary:hover:not(:disabled) {
      background-color: #616161;
    }
    
    .btn-success {
      background-color: #4caf50;
      color: white;
    }
    
    .btn-success:hover:not(:disabled) {
      background-color: #388e3c;
    }
    
    .btn-warning {
      background-color: #ff9800;
      color: white;
    }
    
    .btn-warning:hover:not(:disabled) {
      background-color: #f57c00;
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class ButtonComponent {
  @Input() label: string = 'Button';
  @Input() variant: 'primary' | 'secondary' | 'success' | 'warning' = 'primary';
  @Input() disabled: boolean = false;
  @Output() clicked = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    return `btn-${this.variant}`;
  }

  handleClick(event: MouseEvent): void {
    if (!this.disabled) {
      this.clicked.emit(event);
    }
  }
}

