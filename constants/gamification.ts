/**
 * Constantes y helpers para gamificación (XP, nivel).
 * Usado en perfil y en detalle de libro al actualizar páginas.
 */
export const XP_PER_LEVEL = 500;

export function getLevelProgress(xp: number): number {
  const currentLevelXp = xp % XP_PER_LEVEL;
  return Math.min(1, currentLevelXp / XP_PER_LEVEL);
}
