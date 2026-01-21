import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() userName = 'User';
  @Input() userRole = 'Administrator';
  @Output() menuToggle = new EventEmitter<void>();
  @Output() userMenuToggle = new EventEmitter<void>();

  showUserMenu = false;
  showNotifications = false;
  notificationCount = 3;

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.showNotifications = false;
    }
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showUserMenu = false;
    }
  }

  onLogout(): void {
    // Implement logout logic
    console.log('Logout clicked');
  }

  onProfile(): void {
    // Navigate to profile
    console.log('Profile clicked');
  }
}
