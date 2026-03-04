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
  primary: "#3B4F8C", // Índigo profundo — moderno, confiable
  primaryDark: "#273666", // Índigo oscuro
  background: "#F4F3F8", // Blanco lavanda suave — no tan frío como blanco puro
  surface: "#FFFFFF",
  text: "#12131A", // Casi negro con tinte azulado
  textSecondary: "#5A5D72", // Slate medio
  border: "#DDE0EF", // Lavanda muy suave
  error: "#C0392B",
  success: "#1A7A5E", // Verde esmeralda apagado
  warning: "#D4880A", // Ámbar cálido
};

const dark: AppColorsPalette = {
  primary: "#6B84D4", // Índigo claro — vibra bien sobre oscuro
  primaryDark: "#3B4F8C",
  background: "#0F1117", // Casi negro azulado — más rico que gris neutro
  surface: "#1C1F2E", // Superficie con tinte índigo
  text: "#EEF0FA", // Blanco con leve tinte lavanda
  textSecondary: "#8B90AC", // Slate claro
  border: "#2E3348", // Borde índigo oscuro
  error: "#E05C5C",
  success: "#4DB896", // Verde menta vibrante
  warning: "#F0AD3E", // Ámbar dorado
};

/** Colores en modo claro (compatibilidad). */
export const AppColors = light;

/** Devuelve la paleta según el tema. */
export function getAppColors(isDark: boolean): AppColorsPalette {
  return isDark ? dark : light;
}
