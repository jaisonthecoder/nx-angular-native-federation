// Export your shared models and interfaces here
export * from './user.model';
export * from './product.model';
export * from './api.model';
export * from './auth.model';
export * from './common.types';
export * from './user-context.model';
export * from './user-roles.model';
export * from './environment.model';

// Export Keycloak Admin models (excluding duplicates)
export {
  // Realm
  type KeycloakRealm,
  type CreateRealmDto,
  // Client
  type KeycloakClient,
  type CreateClientDto,
  // Group
  type KeycloakGroup,
  type CreateGroupDto,
  type GroupHierarchyNode,
  // Role
  type KeycloakRole,
  type CreateKeycloakRoleDto,
  type CompositeRoleDto,
  type RoleMappingDto,
  type ClientRoleMappingDto,
  // User (Admin-specific)
  type KeycloakAdminUser,
  type UserCredential,
  type CreateKeycloakUserDto,
  type UserGroupAssignment,
  type UserRoleAssignment,
  // Permission
  type PermissionRole,
  type PermissionAssignment,
  // Client Scope
  type KeycloakClientScope,
  type CreateClientScopeDto,
  type ProtocolMapper,
  // API Response
  type KeycloakApiResponse,
  type KeycloakApiError,
  // Query
  type UserQueryParams,
  type ClientQueryParams,
  type GroupQueryParams,
  // Hierarchy (Admin-specific)
  type ApplicationHierarchy,
  // Bulk
  type BulkUserOperation,
  type BulkGroupOperation,
  // Statistics
  type RealmStatistics,
  type ClientStatistics
} from './keycloak-admin.model';

