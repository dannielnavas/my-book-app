import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { AppColorsPalette } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";

export default function UnlockScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { unlockWithBiometric, logout } = useAuth();

  const handleUnlock = () => {
    Alert.alert(
      "Inicio con biometría",
      "Vas a iniciar sesión con Face ID o Touch ID para acceder a tu cuenta.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          onPress: async () => {
            try {
              await unlockWithBiometric();
              router.replace("/(tabs)");
            } catch {
              Alert.alert("Error", "No se pudo verificar la biometría");
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Mi Libro App</Text>
        <Text style={styles.subtitle}>
          Usa Face ID o Touch ID para desbloquear
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleUnlock}>
          <Text style={styles.buttonText}>Desbloquear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.outlineButton} onPress={handleLogout}>
          <Text style={styles.outlineButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColorsPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: "center",
    },
    content: {
      paddingHorizontal: 24,
      alignItems: "center",
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.primary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 32,
      textAlign: "center",
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 48,
      marginBottom: 16,
    },
    buttonText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "600",
    },
    outlineButton: {
      paddingVertical: 12,
    },
    outlineButtonText: {
      color: colors.textSecondary,
      fontSize: 15,
    },
  });
}
