import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AuthState {
  isAuthenticated: boolean;
  username: string;
  roles: string[];
  token?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SharedAuthService {
  private authState = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    username: '',
    roles: [],
  });

  public authState$: Observable<AuthState> = this.authState.asObservable();

  setAuthState(state: AuthState): void {
    this.authState.next(state);
  }

  getAuthState(): AuthState {
    return this.authState.value;
  }

  isAuthenticated(): boolean {
    return this.authState.value.isAuthenticated;
  }

  getUsername(): string {
    return this.authState.value.username;
  }

  getToken(): string | undefined {
    return this.authState.value.token;
  }

  getRoles(): string[] {
    return this.authState.value.roles;
  }

  hasRole(role: string): boolean {
    return this.authState.value.roles.includes(role);
  }

  clearAuthState(): void {
    this.authState.next({
      isAuthenticated: false,
      username: '',
      roles: [],
    });
  }
}
