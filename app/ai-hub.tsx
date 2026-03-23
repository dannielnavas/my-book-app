import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AiToolHeader } from "@/components/AiToolHeader";
import type { AppColorsPalette } from "@/constants/colors";
import { useAppColors } from "@/hooks/use-app-colors";

type Tool = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route:
    | "/recommendations"
    | "/ai-summary"
    | "/ai-similar"
    | "/ai-reading-plan"
    | "/ai-ask";
};

const TOOLS: Tool[] = [
  {
    id: "rec",
    title: "Recomendaciones",
    description: "Según tu biblioteca, gustos y géneros.",
    icon: "sparkles-outline",
    route: "/recommendations",
  },
  {
    id: "sum",
    title: "Resumen y temas",
    description: "A partir de título, autor o descripción.",
    icon: "document-text-outline",
    route: "/ai-summary",
  },
  {
    id: "sim",
    title: "Libros parecidos",
    description: "Encuentra lecturas similares a una referencia.",
    icon: "git-compare-outline",
    route: "/ai-similar",
  },
  {
    id: "plan",
    title: "Plan de lectura",
    description: "Calendario o pasos para terminar un libro.",
    icon: "calendar-outline",
    route: "/ai-reading-plan",
  },
  {
    id: "ask",
    title: "Preguntar al libro",
    description: "Preguntas con contexto de un libro o texto.",
    icon: "chatbubble-ellipses-outline",
    route: "/ai-ask",
  },
];

export default function AiHubScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentW = Math.min(width - 32, 400);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom: 32 + insets.bottom,
            alignItems: "center",
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: contentW }}>
          <AiToolHeader
            title="Asistente IA"
            subtitle="Herramientas pensadas para leer mejor. Cada acción usa tu cuota mensual en el servidor."
          />
        </View>

        <View style={[styles.grid, { width: contentW }]}>
          {TOOLS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.tile}
              onPress={() => router.push(t.route)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t.title}
            >
              <View style={styles.tileIconWrap}>
                <Ionicons name={t.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.tileText}>
                <Text style={styles.tileTitle}>{t.title}</Text>
                <Text style={styles.tileDesc}>{t.description}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColorsPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 16,
    },
    grid: {
      gap: 12,
    },
    tile: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tileIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    tileText: {
      flex: 1,
      minWidth: 0,
    },
    tileTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    tileDesc: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
  });
}
