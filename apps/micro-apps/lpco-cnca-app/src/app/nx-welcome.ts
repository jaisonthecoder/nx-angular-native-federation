import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nx-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
      <h1 class="common_header">LPCO CNCA Micro-App</h1>
      <p>License, Permit, Certificate, and Other authorizations</p>

      <div style="margin-top: 2rem; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
        <h3>Micro-Frontend Architecture</h3>
        <p style="font-size: 0.9rem; line-height: 1.6;">
          <strong>✓ This is a standalone micro-frontend application</strong><br>
          <strong>✓ Loads independently via Module Federation</strong><br>
          <strong>✓ Can share authentication with the shell app</strong>
        </p>
      </div>

      <div style="margin-top: 2rem; padding: 1rem; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h3>Status</h3>
        <p>✅ Micro-app is running successfully on port 4202</p>
        <p style="font-size: 0.9rem; color: #666;">
          Loaded via Native Federation from the jul-portal shell application.
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class NxWelcome implements OnInit {
  ngOnInit() {
    console.log('LPCO CNCA Micro-App initialized');
  }
}
