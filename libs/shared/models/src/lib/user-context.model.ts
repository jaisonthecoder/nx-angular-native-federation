/**
 * User Context Models for Multi-Tenant Keycloak Architecture
 * Supports: Application > Company > Profile > Role > Permissions hierarchy
 */

export interface UserContext {
  application: ApplicationContext;
  company: CompanyContext;
  profile: ProfileContext;
  role: RoleContext;
  permissions: UserPermission[];
}

export interface ApplicationContext {
  id: string;
  name: string;
  clientId: string;
}

export interface CompanyContext {
  id: string;
  name: string;
  keycloakGroupPath: string;
}

export interface ProfileContext {
  id: string;
  name: string;
  keycloakGroupPath: string;
}

export interface RoleContext {
  id: string;
  name: string;
  keycloakRoleName: string;
  permissions: UserPermission[];
}

export interface UserPermission {
  resource: string;
  action: PermissionAction;
}

export enum PermissionAction {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  CREATE = 'create',
  APPROVE = 'approve',
  EXECUTE = 'execute'
}

/**
 * Multi-context user (belongs to multiple applications/companies)
 */
export interface MultiContextUser {
  userId: string;
  email: string;
  username: string;
  contexts: UserContext[];
  currentContext: UserContext | null;
}

/**
 * Group hierarchy structure
 */
export interface GroupHierarchy {
  applicationId: string;
  applicationName: string;
  companies: CompanyHierarchy[];
}

export interface CompanyHierarchy {
  companyId: string;
  companyName: string;
  keycloakGroupId: string;
  keycloakGroupPath: string;
  profiles: ProfileHierarchy[];
}

export interface ProfileHierarchy {
  profileId: string;
  profileName: string;
  keycloakGroupId: string;
  keycloakGroupPath: string;
  roles: RoleHierarchy[];
}

export interface RoleHierarchy {
  roleId: string;
  roleName: string;
  keycloakRoleName: string;
  keycloakGroupId: string;
  keycloakGroupPath: string;
  permissions: UserPermission[];
}

/**
 * Admin DTOs for creating hierarchy
 */
export interface CreateApplicationDto {
  id: string;
  name: string;
  clientId: string;
}

export interface CreateCompanyDto {
  id: string;
  name: string;
  applicationId: string;
}

export interface CreateProfileDto {
  id: string;
  name: string;
  companyId: string;
}

export interface CreateRoleDto {
  id: string;
  name: string;
  profileId: string;
  permissions: UserPermission[];
}

export interface AssignUserToRoleDto {
  userId: string;
  applicationId: string;
  companyId: string;
  profileId: string;
  roleId: string;
}

