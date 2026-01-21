# JUL Login Page - Angular 20 Light & Dark Theme Implementation

## Table of Contents
1. [Project Setup](#project-setup)
2. [Component Structure](#component-structure)
3. [Theme Service](#theme-service)
4. [Component TypeScript](#component-typescript)
5. [Component Template](#component-template)
6. [Component Styles (SCSS)](#component-styles-scss)
7. [Global Styles](#global-styles)
8. [Module Configuration](#module-configuration)
9. [Usage Instructions](#usage-instructions)


---

## Project Setup

### Install Dependencies

```bash
# If you need Angular Material (optional)
ng add @angular/material

# Or use standalone components (recommended for Angular 20)
```

### File Structure

```
src/
├── app/
│   ├── core/
│   │   └── services/
│   │       └── theme.service.ts
│   ├── features/
│   │   └── auth/
│   │       └── login/
│   │           ├── login.component.ts
│   │           ├── login.component.html
│   │           └── login.component.scss
│   └── shared/
│       └── models/
│           └── theme.model.ts
├── assets/
│   └── images/
│       ├── jul-logo.png
│       └── port-background.jpg
└── styles/
    ├── _variables.scss
    └── styles.scss
```

---

## Theme Service

### `src/app/core/services/theme.service.ts`

```typescript
import { Injectable, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private document = inject(DOCUMENT);
  
  // Using Angular Signals (Angular 16+)
  currentTheme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Effect to apply theme changes
    effect(() => {
      this.applyTheme(this.currentTheme());
    });

    // Listen for system theme changes
    this.watchSystemTheme();
  }

  private getInitialTheme(): Theme {
    // Check localStorage first
    const savedTheme = localStorage.getItem('jul-theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  toggleTheme(): void {
    const newTheme: Theme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.currentTheme.set(newTheme);
    localStorage.setItem('jul-theme', newTheme);
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    localStorage.setItem('jul-theme', theme);
  }

  private applyTheme(theme: Theme): void {
    this.document.documentElement.setAttribute('data-theme', theme);
  }

  private watchSystemTheme(): void {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only update if user hasn't manually set a preference
      if (!localStorage.getItem('jul-theme')) {
        this.currentTheme.set(e.matches ? 'dark' : 'light');
      }
    });
  }

  isDark(): boolean {
    return this.currentTheme() === 'dark';
  }
}
```

---

## Component TypeScript

### `src/app/features/auth/login/login.component.ts`

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public themeService = inject(ThemeService);

  // Signals for reactive state
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(value => !value);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const { email, password, rememberMe } = this.loginForm.value;

      // Simulate API call
      setTimeout(() => {
        // Replace with actual authentication service
        console.log('Login attempt:', { email, password, rememberMe });
        
        // Example: Success
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
        
        // Example: Error
        // this.isLoading.set(false);
        // this.errorMessage.set('Invalid email or password');
      }, 1500);
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Getter methods for template
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get emailError(): string {
    if (this.email?.hasError('required')) {
      return 'Email is required';
    }
    if (this.email?.hasError('email')) {
      return 'Please enter a valid email';
    }
    return '';
  }

  get passwordError(): string {
    if (this.password?.hasError('required')) {
      return 'Password is required';
    }
    if (this.password?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }
}
```

---

## Component Template

### `src/app/features/auth/login/login.component.html`

```html
<div class="login-page">
  <!-- Theme Toggle Button -->
  <button 
    class="theme-toggle" 
    (click)="toggleTheme()"
    [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
    type="button">
    @if (themeService.isDark()) {
      <!-- Sun Icon for Light Mode -->
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    } @else {
      <!-- Moon Icon for Dark Mode -->
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    }
  </button>

  <div class="login-container">
    <!-- Logo -->
    <div class="jul-logo">
      <img src="assets/images/jul-logo.png" alt="JUL Logo" class="logo-icon">
      <div class="logo-text">
        <span class="logo-text-main">JUL</span>
        <span class="logo-text-sub">Janela Única Logística</span>
      </div>
    </div>

    <!-- Heading -->
    <h1 class="login-heading">Login</h1>
    <p class="login-subheading">Enter your email and password to access your account</p>

    <!-- Error Message -->
    @if (errorMessage()) {
      <div class="error-alert" role="alert">
        {{ errorMessage() }}
      </div>
    }

    <!-- Login Form -->
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
      
      <!-- Email Field -->
      <div class="form-group">
        <label for="email" class="form-label">Username</label>
        <input 
          type="email" 
          id="email" 
          formControlName="email"
          class="form-input" 
          [class.error]="email?.invalid && email?.touched"
          placeholder="Enter the Email Id"
          autocomplete="email">
        @if (email?.invalid && email?.touched) {
          <span class="error-message">{{ emailError }}</span>
        }
      </div>

      <!-- Password Field -->
      <div class="form-group">
        <label for="password" class="form-label">Password</label>
        <div class="password-input-wrapper">
          <input 
            [type]="showPassword() ? 'text' : 'password'"
            id="password" 
            formControlName="password"
            class="form-input" 
            [class.error]="password?.invalid && password?.touched"
            placeholder="Enter the Password"
            autocomplete="current-password">
          <button 
            type="button" 
            class="password-toggle"
            (click)="togglePasswordVisibility()"
            [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
            @if (showPassword()) {
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          </button>
        </div>
        @if (password?.invalid && password?.touched) {
          <span class="error-message">{{ passwordError }}</span>
        }
      </div>

      <!-- Remember Me & Forgot Password -->
      <div class="form-options">
        <div class="remember-me">
          <input 
            type="checkbox" 
            id="remember" 
            formControlName="rememberMe">
          <label for="remember">Remember Password</label>
        </div>
        <a routerLink="/forgot-password" class="forgot-password">Forgot password?</a>
      </div>

      <!-- Login Button -->
      <button 
        type="submit" 
        class="login-button"
        [class.loading]="isLoading()"
        [disabled]="isLoading()">
        @if (isLoading()) {
          <span class="spinner"></span>
        } @else {
          Login
        }
      </button>
    </form>

    <!-- Sign Up Link -->
    <p class="signup-link">
      Don't have an account? <a routerLink="/register" class="create-account">Create an account</a>
    </p>
  </div>
</div>
```

---

## Component Styles (SCSS)

### `src/app/features/auth/login/login.component.scss`

```scss
// Import global variables
@import '../../../../styles/variables';

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-body);
  background-image: url('/assets/images/port-background.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: var(--spacing-lg);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(26, 58, 92, 0.8) 0%, rgba(10, 25, 41, 0.9) 100%);
    transition: background var(--transition-normal);
  }

  :host-context([data-theme="dark"]) &::before {
    background: linear-gradient(135deg, rgba(10, 25, 41, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%);
  }
}

.theme-toggle {
  position: fixed;
  top: 24px;
  right: 24px;
  background: var(--bg-container);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  z-index: 1000;
  box-shadow: var(--shadow-container);

  &:hover {
    transform: scale(1.1);
    border-color: var(--primary-blue);
  }

  svg {
    width: 24px;
    height: 24px;
    color: var(--text-primary);
    transition: transform var(--transition-normal);
  }

  &:hover svg {
    transform: rotate(20deg);
  }
}

.login-container {
  background: var(--bg-container);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  max-width: 450px;
  width: 100%;
  box-shadow: var(--shadow-container);
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
  transition: all var(--transition-normal);

  &:hover {
    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
  }

  :host-context([data-theme="dark"]) &:hover {
    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.6);
  }
}

.jul-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);

  .logo-icon {
    width: 48px;
    height: 48px;
    transition: transform var(--transition-fast);
  }

  .logo-text {
    display: flex;
    flex-direction: column;

    &-main {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.5px;
    }

    &-sub {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 400;
    }
  }
}

.login-heading {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  line-height: 1.2;
}

.login-subheading {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.5;
}

.error-alert {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 14px;
  margin-bottom: var(--spacing-lg);

  :host-context([data-theme="dark"]) & {
    background: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.form-input {
  width: 100%;
  padding: 14px var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-primary);
  background-color: var(--bg-input);
  transition: all var(--transition-fast);
  outline: none;

  &::placeholder {
    color: var(--text-placeholder);
  }

  &:focus {
    border-color: var(--border-color-focus);
    box-shadow: 0 0 0 3px rgba(74, 127, 215, 0.1);

    :host-context([data-theme="dark"]) & {
      box-shadow: 0 0 0 3px rgba(74, 127, 215, 0.2);
    }
  }

  &:hover:not(:focus) {
    border-color: var(--text-secondary);
  }

  &.error {
    border-color: #ef4444;

    &:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  }
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;

  :host-context([data-theme="dark"]) & {
    color: #fca5a5;
  }
}

.password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color var(--transition-fast);

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    color: var(--text-primary);
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: calc(var(--spacing-lg) * -0.5);
}

.remember-me {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--primary-blue);
  }

  label {
    font-size: 14px;
    color: var(--text-secondary);
    cursor: pointer;
    user-select: none;
  }
}

.forgot-password {
  color: var(--primary-blue);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--primary-blue-hover);
    text-decoration: underline;
  }
}

.login-button {
  width: 100%;
  background: var(--primary-blue);
  color: var(--text-white);
  padding: 14px var(--spacing-md);
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 4px 12px rgba(74, 127, 215, 0.3);
  position: relative;

  &:hover:not(:disabled) {
    background: var(--primary-blue-hover);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(74, 127, 215, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  &.loading {
    color: transparent;
  }
}

.spinner {
  position: absolute;
  width: 20px;
  height: 20px;
  top: 50%;
  left: 50%;
  margin-left: -10px;
  margin-top: -10px;
  border: 2px solid var(--text-white);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.signup-link {
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: var(--spacing-lg);
}

.create-account {
  color: var(--primary-blue);
  text-decoration: none;
  font-weight: 600;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--primary-blue-hover);
    text-decoration: underline;
  }
}

// Responsive Design
@media (max-width: 768px) {
  .login-page {
    padding: var(--spacing-md);
  }
  
  .login-container {
    padding: var(--spacing-lg);
  }
  
  .login-heading {
    font-size: 28px;
  }
  
  .theme-toggle {
    top: 16px;
    right: 16px;
    width: 44px;
    height: 44px;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: var(--spacing-lg) var(--spacing-md);
  }
  
  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
}
```

---

## Global Styles

### `src/styles/_variables.scss`

```scss
// ==========================================
// CSS Variables for Light & Dark Themes
// ==========================================

:root {
  // Light Theme (Default)
  --primary-blue: #4A7FD7;
  --primary-blue-hover: #3D6BB8;
  --primary-orange: #FF6B35;
  
  --bg-body: #1a3a5c;
  --bg-container: rgba(255, 255, 255, 0.95);
  --bg-input: #ffffff;
  
  --text-primary: #000000;
  --text-secondary: #666666;
  --text-placeholder: #999999;
  --text-white: #ffffff;
  
  --border-color: #E0E0E0;
  --border-color-focus: #4A7FD7;
  
  --shadow-container: 0 10px 40px rgba(0, 0, 0, 0.1);
  --shadow-input: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  // Spacing
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 48px;
  
  // Border Radius
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 16px;
  
  // Transitions
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
}

// Dark Theme Variables
[data-theme="dark"] {
  --bg-body: #0a1929;
  --bg-container: rgba(30, 41, 59, 0.95);
  --bg-input: #1e293b;
  
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-placeholder: #64748b;
  
  --border-color: #334155;
  --border-color-focus: #4A7FD7;
  
  --shadow-container: 0 10px 40px rgba(0, 0, 0, 0.5);
  --shadow-input: 0 2px 8px rgba(0, 0, 0, 0.3);
}
```

### `src/styles/styles.scss`

```scss
@import 'variables';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background-color var(--transition-normal);
}

// Accessibility
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

// Focus visible for keyboard navigation
*:focus-visible {
  outline: 2px solid var(--primary-blue);
  outline-offset: 2px;
}
```

---

## Module Configuration

### Option 1: Standalone Component (Recommended for Angular 20)

The component is already configured as standalone with:
```typescript
standalone: true,
imports: [CommonModule, ReactiveFormsModule]
```

### Option 2: Module-based (if using NgModule)

```typescript
// src/app/features/auth/auth.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';

@NgModule({
  declarations: [LoginComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      { path: 'login', component: LoginComponent }
    ])
  ]
})
export class AuthModule { }
```

---

## Usage Instructions

### 1. **Generate Component (if not created)**

```bash
ng generate component features/auth/login --standalone
```

### 2. **Generate Service**

```bash
ng generate service core/services/theme
```

### 3. **Update angular.json**

Add global styles:

```json
"styles": [
  "src/styles/styles.scss"
],
"stylePreprocessorOptions": {
  "includePaths": [
    "src/styles"
  ]
}
```

### 4. **Add Assets**

Place your images in `src/assets/images/`:
- `jul-logo.png`
- `port-background.jpg`

### 5. **Routing Configuration**

```typescript
// app.routes.ts (Angular 20 with standalone components)
import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  // ... other routes
];
```

### 6. **Run the Application**

```bash
ng serve
```

---

## Features Included

✅ **Angular 20 Signals** - Modern reactive state management  
✅ **Standalone Components** - No NgModule required  
✅ **Reactive Forms** - Full form validation  
✅ **Theme Service** - Persistent theme with localStorage  
✅ **TypeScript** - Full type safety  
✅ **SCSS** - Organized and maintainable styles  
✅ **Responsive Design** - Mobile-first approach  
✅ **Accessibility** - ARIA labels and keyboard navigation  
✅ **Control Flow Syntax** - New Angular @if, @else syntax  
✅ **Form Validation** - Email and password validation  
✅ **Loading States** - Button loading spinner  
✅ **Error Handling** - Form and API error messages  

---

## Additional Enhancements

### Authentication Service

```typescript
// src/app/core/services/auth.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  isAuthenticated = signal(false);
  currentUser = signal<LoginResponse['user'] | null>(null);

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', credentials).pipe(
      tap(response => {
        localStorage.setItem('auth_token', response.token);
        this.isAuthenticated.set(true);
        this.currentUser.set(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
```

### Environment Configuration

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.julangola.com'
};
```

---

## Testing

### Component Test

```typescript
// login.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login.component';
import { ThemeService } from '../../../core/services/theme.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [ThemeService]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form when empty', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should validate email format', () => {
    const email = component.loginForm.controls['email'];
    email.setValue('invalid-email');
    expect(email.hasError('email')).toBeTruthy();
  });
});
```

---

## Performance Optimization

### Lazy Loading

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  }
];

// auth.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';

export const AUTH_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent) }
];
```

---

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

**Version:** 1.0.0 (Angular 20)  
**Last Updated:** January 2026  
**Framework:** Angular 20 with Signals & Standalone Components

