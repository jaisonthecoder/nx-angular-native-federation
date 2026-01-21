/**
 * Comprehensive User Roles & Permissions Models
 * Used for fetching and representing all role information from Keycloak
 */

/**
 * Complete user role information response
 */
export interface UserRolesResponse {
  userId: string;
  username: string;
  email?: string;
  realmRoles: RealmRoleInfo[];
  clientRoles: ClientRoleInfo[];
  groups: GroupInfo[];
  effectiveRoles: string[]; // All roles (realm + client) as flat array
  permissions?: PermissionInfo[];
  tokenInfo: TokenRoleInfo;
  fetchedAt: string; // ISO timestamp
}

/**
 * Realm-level role information
 */
export interface RealmRoleInfo {
  id: string;
  name: string;
  description?: string;
  composite: boolean;
  clientRole: false;
  containerId: string; // realm name
  attributes?: Record<string, string[]>;
}

/**
 * Client-level role information
 */
export interface ClientRoleInfo {
  clientId: string;
  clientName?: string;
  roles: ClientRoleDetail[];
}

export interface ClientRoleDetail {
  id: string;
  name: string;
  description?: string;
  composite: boolean;
  clientRole: true;
  containerId: string; // client UUID
  attributes?: Record<string, string[]>;
}

/**
 * Group information
 */
export interface GroupInfo {
  id: string;
  name: string;
  path: string;
  realmRoles?: string[];
  clientRoles?: Record<string, string[]>;
  subGroups?: GroupInfo[];
}

/**
 * Permission information (if using Keycloak Authorization Services)
 */
export interface PermissionInfo {
  resource: string;
  scopes: string[];
  resourceType?: string;
}

/**
 * Role information extracted from access token
 */
export interface TokenRoleInfo {
  realmAccess: {
    roles: string[];
  };
  resourceAccess: Record<string, {
    roles: string[];
  }>;
  // Additional token claims
  email?: string;
  emailVerified?: boolean;
  name?: string;
  preferredUsername?: string;
  givenName?: string;
  familyName?: string;
}

/**
 * Keycloak Userinfo endpoint response
 */
export interface KeycloakUserinfoResponse {
  sub: string;
  email_verified: boolean;
  name?: string;
  preferred_username: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: Record<string, {
    roles: string[];
  }>;
  [key: string]: any;
}

/**
 * Keycloak Admin API Role Mappings Response
 */
export interface KeycloakRoleMappingsResponse {
  realmMappings?: RealmRoleInfo[];
  clientMappings?: Record<string, {
    client: string;
    mappings: ClientRoleDetail[];
  }>;
}

/**
 * Options for fetching user roles
 */
export interface FetchUserRolesOptions {
  includeGroups?: boolean;
  includePermissions?: boolean;
  includeTokenInfo?: boolean;
  includeUserinfo?: boolean;
  useAdminAPI?: boolean; // Requires admin token
}

