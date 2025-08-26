export function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

export function sanitizeUser(user: any) {
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function generateUniqueFilename(originalName: string): string {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = originalName.split('.').pop();
  return `file-${uniqueSuffix}.${ext}`;
}

export function isValidRole(role: string): boolean {
  return ['counselor', 'branch_manager', 'admin_staff'].includes(role);
}

export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'counselor': 1,
    'branch_manager': 2,
    'admin_staff': 3
  };
  
  return (roleHierarchy as any)[userRole] >= (roleHierarchy as any)[requiredRole];
}
