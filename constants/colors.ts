/**
 * Paleta para Mi Libro App (basada en PRD/Figma).
 * Uso en pantallas de auth, biblioteca, perfil.
 * Modo claro y oscuro: usar getAppColors(isDark) o useAppColors().
 */

export type AppColorsPalette = {
  primary: string;
  primaryDark: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
};

const light: AppColorsPalette = {
  primary: '#2D5A27',
  primaryDark: '#1E3D1A',
  background: '#F8F6F3',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#5C5C5C',
  border: '#E0E0E0',
  error: '#C62828',
  success: '#2E7D32',
  warning: '#F9A825',
};

const dark: AppColorsPalette = {
  primary: '#4A9C3E',
  primaryDark: '#2D5A27',
  background: '#1A1A1A',
  surface: '#2D2D2D',
  text: '#F0F0F0',
  textSecondary: '#A0A0A0',
  border: '#404040',
  error: '#EF5350',
  success: '#66BB6A',
  warning: '#FFB74D',
};

/** Colores en modo claro (compatibilidad). */
export const AppColors = light;

/** Devuelve la paleta según el tema. */
export function getAppColors(isDark: boolean): AppColorsPalette {
  return isDark ? dark : light;
}
