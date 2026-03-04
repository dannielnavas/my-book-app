import { getAppColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** Hook que devuelve la paleta de colores según el tema del sistema (claro/oscuro). */
export function useAppColors() {
  const colorScheme = useColorScheme();
  return getAppColors(colorScheme === 'dark');
}
