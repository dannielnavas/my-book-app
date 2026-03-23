import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import type { AppColorsPalette } from "@/constants/colors";
import { useAppDialog } from "@/context/AppDialogContext";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";

export default function UnlockScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { unlockWithBiometric, logout } = useAuth();
  const { alert: appAlert } = useAppDialog();
  const [unlocking, setUnlocking] = useState(false);

  const iconScale = useSharedValue(1);

  useEffect(() => {
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handleUnlock = () => {
    appAlert(
      "Desbloquear Mi Libro",
      "Usa la huella o el rostro guardados en tu dispositivo para seguir leyendo.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          onPress: async () => {
            setUnlocking(true);
            try {
              await unlockWithBiometric();
              router.replace("/(tabs)");
            } catch {
              setTimeout(() => {
                appAlert(
                  "No pudimos verificar tu identidad",
                  "Inténtalo otra vez o cierra sesión e inicia con tu contraseña.",
                  undefined,
                  { tone: "error" },
                );
              }, 350);
            } finally {
              setUnlocking(false);
            }
          },
        },
      ],
      { tone: "info" },
    );
  };

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {unlocking ? (
        <View style={styles.busyOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.busyText}>Verificando biometría…</Text>
        </View>
      ) : null}
      <View style={styles.topSection}>
        <Animated.View entering={FadeInDown.duration(600).springify()}>
          <View style={styles.logoContainer}>
            <Ionicons name="book" size={32} color={colors.primary} />
          </View>
        </Animated.View>
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(600).delay(200).springify()}>
          <Text style={styles.title}>Bienvenido de nuevo</Text>
          <Text style={styles.subtitle}>
            Toca el ícono para desbloquear Mi Libro App con biometría y continuar leyendo.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(800).delay(400).springify()}>
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleUnlock}
            activeOpacity={0.8}
            disabled={unlocking}
          >
            <Animated.View style={[styles.iconWrapper, animatedIconStyle]}>
              <View style={styles.iconContainer}>
                <Ionicons name="finger-print" size={56} color={colors.surface} />
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Animated.View
        style={styles.footer}
        entering={FadeInUp.duration(600).delay(600).springify()}
      >
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={handleLogout}
          disabled={unlocking}
        >
          <Text style={styles.outlineButtonText}>Inicia sesión con otra cuenta</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColorsPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    busyOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(15, 17, 23, 0.4)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 40,
      gap: 12,
    },
    busyText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    topSection: {
      paddingTop: 40,
      paddingHorizontal: 24,
      alignItems: "center",
    },
    logoContainer: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.border,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 4,
    },
    content: {
      flex: 1,
      paddingHorizontal: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 32,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 12,
      textAlign: "center",
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 60,
    },
    biometricButton: {
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapper: {
      padding: 12,
      borderRadius: 100,
      backgroundColor: "rgba(59, 79, 140, 0.1)", // A soft ring around the main button using a primary-like color alpha
    },
    iconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 10,
    },
    footer: {
      paddingBottom: 24,
      paddingHorizontal: 24,
      alignItems: "center",
    },
    outlineButton: {
      paddingVertical: 16,
      paddingHorizontal: 24,
    },
    outlineButtonText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: "600",
      textAlign: "center",
      textDecorationLine: "underline",
    },
  });
}
