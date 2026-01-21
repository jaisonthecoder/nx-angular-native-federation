import { Injectable, inject } from '@angular/core';
import { UserContextService } from './user-context.service';
import { PermissionAction } from '@angola-workspace/shared/models';

/**
 * Service for checking user permissions
 * Provides convenient methods for permission-based access control
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly userContextService = inject(UserContextService);

  /**
   * Check if user can view
   */
  canView(resource?: string): boolean {
    return this.userContextService.hasPermission(PermissionAction.VIEW, resource);
  }

  /**
   * Check if user can create
   */
  canCreate(resource?: string): boolean {
    return this.userContextService.hasPermission(PermissionAction.CREATE, resource);
  }

  /**
   * Check if user can edit
   */
  canEdit(resource?: string): boolean {
    return this.userContextService.hasPermission(PermissionAction.EDIT, resource);
  }

  /**
   * Check if user can delete
   */
  canDelete(resource?: string): boolean {
    return this.userContextService.hasPermission(PermissionAction.DELETE, resource);
  }

  /**
   * Check if user can approve
   */
  canApprove(resource?: string): boolean {
    return this.userContextService.hasPermission(PermissionAction.APPROVE, resource);
  }

  /**
   * Check if user can execute
   */
  canExecute(resource?: string): boolean {
    return this.userContextService.hasPermission(PermissionAction.EXECUTE, resource);
  }

  /**
   * Check if user has any of the specified actions
   */
  canAny(actions: PermissionAction[], resource?: string): boolean {
    return this.userContextService.hasAnyPermission(actions, resource);
  }

  /**
   * Check if user has all specified actions
   */
  canAll(actions: PermissionAction[], resource?: string): boolean {
    return this.userContextService.hasAllPermissions(actions, resource);
  }

  /**
   * Get all permissions for current context
   */
  getPermissions(): string[] {
    const context = this.userContextService.getCurrentContext();
    return context?.permissions.map(p => p.action) || [];
  }
}

