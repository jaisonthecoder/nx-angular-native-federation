/**
 * Keycloak Admin API Models
 * All interfaces for Keycloak Admin REST API operations
 */

import type {
  UserPermission,
  CompanyHierarchy as UserContextCompanyHierarchy
} from './user-context.model';

// ============================================================================
// REALM MODELS
// ============================================================================

export interface KeycloakRealm {
  id: string;
  realm: string;
  enabled: boolean;
  displayName?: string;
  displayNameHtml?: string;
  userManagedAccessAllowed?: boolean;
  attributes?: Record<string, string>;
  [key: string]: any;
}

export interface CreateRealmDto {
  realm: string;
  enabled?: boolean;
  displayName?: string;
  attributes?: Record<string, string>;
}

// ============================================================================
// CLIENT MODELS
// ============================================================================

export interface KeycloakClient {
  id?: string;
  clientId: string;
  name?: string;
  description?: string;
  enabled: boolean;
  clientAuthenticatorType?: string;
  secret?: string;
  redirectUris?: string[];
  webOrigins?: string[];
  protocol?: string;
  publicClient?: boolean;
  bearerOnly?: boolean;
  consentRequired?: boolean;
  standardFlowEnabled?: boolean;
  implicitFlowEnabled?: boolean;
  directAccessGrantsEnabled?: boolean;
  serviceAccountsEnabled?: boolean;
  attributes?: Record<string, string>;
  [key: string]: any;
}

export interface CreateClientDto {
  clientId: string;
  name?: string;
  description?: string;
  enabled?: boolean;
  protocol?: string;
  publicClient?: boolean;
  bearerOnly?: boolean;
  consentRequired?: boolean;
  standardFlowEnabled?: boolean;
  implicitFlowEnabled?: boolean;
  directAccessGrantsEnabled?: boolean;
  serviceAccountsEnabled?: boolean;
  frontchannelLogout?: boolean;
  fullScopeAllowed?: boolean;
  rootUrl?: string;
  baseUrl?: string;
  adminUrl?: string;
  redirectUris?: string[];
  webOrigins?: string[];
  defaultClientScopes?: string[];
  optionalClientScopes?: string[];
  attributes?: Record<string, string>;
}

// ============================================================================
// GROUP MODELS
// ============================================================================

export interface KeycloakGroup {
  id?: string;
  name: string;
  path?: string;
  parentId?: string;
  subGroups?: KeycloakGroup[];
  realmRoles?: string[];
  clientRoles?: Record<string, string[]>;
  attributes?: Record<string, string[]>;
  [key: string]: any;
}

export interface CreateGroupDto {
  name: string;
  parentId?: string;
  attributes?: Record<string, string[]>;
}

export interface GroupHierarchyNode {
  group: KeycloakGroup;
  children: GroupHierarchyNode[];
  level: number;
  path: string;
}

// ============================================================================
// ROLE MODELS
// ============================================================================

export interface KeycloakRole {
  id?: string;
  name: string;
  description?: string;
  composite?: boolean;
  clientRole?: boolean;
  containerId?: string;
  attributes?: Record<string, string[]>;
  [key: string]: any;
}

// Admin-specific CreateRoleDto (different from user-context.model.ts)
export interface CreateKeycloakRoleDto {
  name: string;
  description?: string;
  composite?: boolean;
  attributes?: Record<string, string[]>;
}

/**
 * Composite Role DTO - Keycloak expects full role objects, not just names
 * This is an array of role objects to add as composites
 */
export type CompositeRoleDto = KeycloakRole[];

export interface RoleMappingDto {
  realmMappings?: KeycloakRole[];
  clientMappings?: Record<string, ClientRoleMappingDto>;
}

export interface ClientRoleMappingDto {
  client?: string;
  mappings?: KeycloakRole[];
}

// ============================================================================
// USER MODELS
// ============================================================================

// Admin-specific user interface (extends auth model)
export interface KeycloakAdminUser {
  id?: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  emailVerified?: boolean;
  attributes?: Record<string, string[]>;
  credentials?: UserCredential[];
  groups?: string[];
  realmRoles?: string[];
  clientRoles?: Record<string, string[]>;
  [key: string]: any;
}

// Note: KeycloakUser from auth.model.ts is different - use KeycloakAdminUser for admin operations

export interface UserCredential {
  type: string;
  value: string;
  temporary?: boolean;
}

// Admin-specific CreateUserDto (different from user.model.ts)
export interface CreateKeycloakUserDto {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  emailVerified?: boolean;
  credentials?: UserCredential[];
  attributes?: Record<string, string[]>;
  groups?: string[];
}

export interface UserGroupAssignment {
  userId: string;
  groupId: string;
}

export interface UserRoleAssignment {
  userId: string;
  realmRoles?: string[];
  clientRoles?: Record<string, string[]>;
}

// ============================================================================
// PERMISSION MODELS
// ============================================================================

export interface PermissionRole {
  name: string;
  description?: string;
  composite?: boolean;
}

export interface PermissionAssignment {
  roleName: string;
  permissions: string[];
}

// ============================================================================
// CLIENT SCOPE MODELS
// ============================================================================

export interface KeycloakClientScope {
  id?: string;
  name: string;
  description?: string;
  protocol?: string;
  attributes?: Record<string, string>;
  protocolMappers?: ProtocolMapper[];
  [key: string]: any;
}

export interface ProtocolMapper {
  id?: string;
  name: string;
  protocol: string;
  protocolMapper: string;
  config: Record<string, string>;
}

export interface CreateClientScopeDto {
  name: string;
  description?: string;
  protocol?: string;
  attributes?: Record<string, string>;
}

// ============================================================================
// API RESPONSE MODELS
// ============================================================================

export interface KeycloakApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface KeycloakApiError {
  error: string;
  errorDescription?: string;
  errorMessage?: string;
  status: number;
}

// ============================================================================
// QUERY/FILTER MODELS
// ============================================================================

export interface UserQueryParams {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  search?: string;
  first?: number;
  max?: number;
  briefRepresentation?: boolean;
}

export interface ClientQueryParams {
  clientId?: string;
  search?: string;
  first?: number;
  max?: number;
}

export interface GroupQueryParams {
  search?: string;
  first?: number;
  max?: number;
}

// ============================================================================
// HIERARCHY MODELS (For Your Structure)
// ============================================================================

// Note: CompanyHierarchy, ProfileHierarchy, RoleHierarchy are exported from user-context.model.ts
// Import them directly: import { CompanyHierarchy } from '@angola-workspace/shared/models';

export interface ApplicationHierarchy {
  applicationId: string;
  applicationName: string;
  clientId: string;
  companies: UserContextCompanyHierarchy[];
}

// ============================================================================
// BULK OPERATION MODELS
// ============================================================================

export interface BulkUserOperation {
  userIds: string[];
  operation: 'assignGroup' | 'removeGroup' | 'assignRole' | 'removeRole' | 'enable' | 'disable' | 'delete';
  targetId?: string; // groupId or roleName
  clientId?: string; // for client roles
}

export interface BulkGroupOperation {
  groupIds: string[];
  operation: 'delete' | 'move';
  targetParentId?: string; // for move operation
}

// ============================================================================
// STATISTICS MODELS
// ============================================================================

export interface RealmStatistics {
  realmName: string;
  totalUsers: number;
  totalClients: number;
  totalGroups: number;
  totalRoles: number;
  activeSessions: number;
}

export interface ClientStatistics {
  clientId: string;
  totalUsers: number;
  totalRoles: number;
  activeSessions: number;
}

