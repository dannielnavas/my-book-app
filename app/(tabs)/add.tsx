import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AppColorsPalette } from "@/constants/colors";
import { useAppColors } from "@/hooks/use-app-colors";

export default function AddTabScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📚</Text>
        <Text style={styles.headerTitle}>Añade un libro</Text>
        <Text style={styles.headerSubtitle}>
          Cada libro que añadas enriquece tu biblioteca. Elige cómo quieres
          hacerlo.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.cardPrimary}
        onPress={() => router.push("/scan")}
        activeOpacity={0.92}
      >
        <View style={styles.cardPrimaryIconWrap}>
          <Text style={styles.cardPrimaryIcon}>📷</Text>
        </View>
        <Text style={styles.cardPrimaryTitle}>Escanear código ISBN</Text>
        <Text style={styles.cardPrimarySubtitle}>
          Enfoca el código de barras del libro y obtén los datos al instante
        </Text>
        <View style={styles.cardPrimaryCta}>
          <Text style={styles.cardPrimaryCtaText}>Escanear ahora</Text>
          <Text style={styles.cardPrimaryCtaArrow}>→</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/search")}
        activeOpacity={0.92}
      >
        <View style={styles.cardIconWrap}>
          <Text style={styles.cardIcon}>🔍</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Buscar por título o autor</Text>
          <Text style={styles.cardSubtitle}>
            Encuentra el libro en la base de datos
          </Text>
        </View>
        <Text style={styles.cardArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: "/add-book", params: {} })}
        activeOpacity={0.92}
      >
        <View style={styles.cardIconWrap}>
          <Text style={styles.cardIcon}>✏️</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Añadir manualmente</Text>
          <Text style={styles.cardSubtitle}>Completa los datos tú mismo</Text>
        </View>
        <Text style={styles.cardArrow}>→</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Tu próxima lectura está a un paso</Text>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: AppColorsPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    header: {
      alignItems: "center",
      marginBottom: 28,
      paddingHorizontal: 8,
    },
    headerIcon: {
      fontSize: 48,
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
      textAlign: "center",
      letterSpacing: 0.2,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      width: "100%",
    },
    cardPrimary: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      padding: 24,
      marginBottom: 16,
      overflow: "hidden",
      borderWidth: 0,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 4,
    },
    cardPrimaryIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    cardPrimaryIcon: {
      fontSize: 28,
    },
    cardPrimaryTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#fff",
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    cardPrimarySubtitle: {
      fontSize: 15,
      color: "rgba(255,255,255,0.9)",
      lineHeight: 22,
      marginBottom: 18,
    },
    cardPrimaryCta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    cardPrimaryCtaText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#fff",
    },
    cardPrimaryCtaArrow: {
      fontSize: 18,
      color: "#fff",
      fontWeight: "600",
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    cardIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    cardIcon: {
      fontSize: 24,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    cardSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    cardArrow: {
      fontSize: 20,
      color: colors.textSecondary,
      fontWeight: "600",
      marginLeft: 8,
    },
    footer: {
      marginTop: 24,
      paddingVertical: 16,
      alignItems: "center",
    },
    footerText: {
      fontSize: 15,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
  });
}
