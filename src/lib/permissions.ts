export function canManageCourse(userRole: string, courseInstructorId: string | null, userId: string): boolean {
  if (userRole === "owner" || userRole === "admin") return true;
  if (userRole === "instructor" && courseInstructorId === userId) return true;
  return false;
}

export function isStaff(role: string): boolean {
  return ["owner", "admin", "instructor"].includes(role);
}

export function isAdminOrOwner(role: string): boolean {
  return ["owner", "admin"].includes(role);
}
