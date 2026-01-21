import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { KeycloakAuthService } from '@angola-workspace/shared/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-container">
      <div class="auth-section">
        @if (isLoggedIn) {
          <div class="user-info">
            <span>Welcome, {{ username }}</span>
            <button class="auth-btn logout-btn" (click)="logout()">Logout</button>
          </div>
        } @else {
          <button class="auth-btn login-btn" (click)="login()">Login with Keycloak</button>
        }
      </div>

      <h1>JUL Portal - Shell Application</h1>
      <p>Welcome to the JUL Portal. Click the button below to load the LPCO CNCA micro-app.</p>

      @if (isLoggedIn) {
        <div class="micro-apps">
          <div class="app-card">
            <h3>LPCO CNCA App</h3>
            <p>License, Permit, Certificate, and Other authorizations</p>
            <button class="load-btn" (click)="loadMicroApp()">
              Load LPCO CNCA App
            </button>
          </div>
        </div>
      } @else {
        <div class="login-message">
          <p>Please login to access the micro applications.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .home-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .auth-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 2rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-info span {
      color: #333;
      font-weight: 500;
    }

    .auth-btn {
      padding: 0.5rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.95rem;
      transition: background 0.2s;
    }

    .login-btn {
      background: #1976d2;
      color: white;
    }

    .login-btn:hover {
      background: #1565c0;
    }

    .logout-btn {
      background: #f44336;
      color: white;
    }

    .logout-btn:hover {
      background: #d32f2f;
    }

    h1 {
      color: #333;
      margin-bottom: 1rem;
    }

    p {
      color: #666;
      margin-bottom: 2rem;
    }

    .login-message {
      text-align: center;
      padding: 3rem;
      background: #f5f5f5;
      border-radius: 8px;
      margin-top: 2rem;
    }

    .login-message p {
      font-size: 1.1rem;
      color: #666;
    }

    .micro-apps {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .app-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .app-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .app-card h3 {
      margin: 0 0 0.5rem 0;
      color: #1976d2;
    }

    .app-card p {
      margin: 0 0 1rem 0;
      font-size: 0.9rem;
      color: #666;
    }

    .load-btn {
      background: #1976d2;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      width: 100%;
      transition: background 0.2s;
    }

    .load-btn:hover {
      background: #1565c0;
    }

    .load-btn:active {
      transform: scale(0.98);
    }
  `]
})
export class HomeComponent implements OnInit {
  private readonly authService = inject(KeycloakAuthService);
  private readonly router = inject(Router);

  isLoggedIn = false;
  username = '';

  async ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.username = this.authService.getUsername();
    }
  }

  async login() {
    await this.authService.login();
  }

  logout() {
    this.authService.logout();
  }

  loadMicroApp() {
    this.router.navigate(['/lpco-cnca-app']);
  }
}
