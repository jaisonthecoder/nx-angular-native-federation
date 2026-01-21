import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDark = signal<boolean>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const isDark = this.isDark();
      const root = document.documentElement;

      if (isDark) {
        root.setAttribute('data-theme', 'dark');
        root.classList.add('dark');
      } else {
        root.setAttribute('data-theme', 'light');
        root.classList.remove('dark');
      }

      localStorage.setItem('jul-theme', isDark ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.update(value => !value);
  }

  setDark(isDark: boolean): void {
    this.isDark.set(isDark);
  }

  private getInitialTheme(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('jul-theme');
      if (stored === 'dark' || stored === 'light') {
        return stored === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }
}
