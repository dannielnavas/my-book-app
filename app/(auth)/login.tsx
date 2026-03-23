import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { AppColorsPalette } from "@/constants/colors";
import { useAppDialog } from "@/context/AppDialogContext";
import { AuthApiError, useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { login, enableBiometric, biometricAvailable } = useAuth();
  const { alert: appAlert } = useAppDialog();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [enablingBiometric, setEnablingBiometric] = useState(false);
  const [useBiometricNext, setUseBiometricNext] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      appAlert(
        "Faltan datos",
        "Introduce tu correo y contraseña para continuar.",
        undefined,
        { tone: "warning" },
      );
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      if (useBiometricNext && biometricAvailable) {
        appAlert(
          "¿Activar acceso rápido?",
          "La próxima vez podrás entrar con la huella o el rostro de tu dispositivo, sin escribir la contraseña.",
          [
            {
              text: "Ahora no",
              style: "cancel",
              onPress: () => {
                router.replace("/(tabs)");
              },
            },
            {
              text: "Activar",
              onPress: async () => {
                setEnablingBiometric(true);
                try {
                  await enableBiometric();
                } catch (e) {
                  const msg =
                    e instanceof AuthApiError
                      ? e.message
                      : "No pudimos activar el acceso biométrico.";
                  setTimeout(() => {
                    appAlert(
                      "No se activó el acceso rápido",
                      msg,
                      undefined,
                      { tone: "error" },
                    );
                  }, 350);
                } finally {
                  setEnablingBiometric(false);
                  router.replace("/(tabs)");
                }
              },
            },
          ],
          { tone: "info" },
        );
      } else {
        router.replace("/(tabs)");
      }
    } catch (e) {
      const msg =
        e instanceof AuthApiError ? e.message : "Error al iniciar sesión";
      appAlert(
        "No pudimos iniciar sesión",
        msg,
        undefined,
        { tone: "error" },
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    appAlert(
      "Google en camino",
      "Pronto podrás entrar con Google. Mientras tanto, usa correo y contraseña o el acceso con huella o rostro si ya lo activaste.",
      undefined,
      { tone: "info" },
    );
  };

  const { width: screenWidth } = useWindowDimensions();
  const sidePadding = 24;

  const busy = loading || enablingBiometric;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {enablingBiometric ? (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.busyOverlayText}>Activando acceso rápido…</Text>
        </View>
      ) : null}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { width: screenWidth }]}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.formContent,
              { width: screenWidth, paddingHorizontal: sidePadding },
            ]}
            collapsable={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Mi Libro App</Text>
              <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!busy}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!busy}
            />

            {biometricAvailable && (
              <TouchableOpacity
                style={styles.biometricRow}
                onPress={() => setUseBiometricNext((v) => !v)}
                disabled={busy}
              >
                <View
                  style={[
                    styles.checkbox,
                    useBiometricNext && styles.checkboxChecked,
                  ]}
                />
                <Text
                  style={styles.biometricLabel}
                  textBreakStrategy="simple"
                  numberOfLines={2}
                  maxFontSizeMultiplier={1.3}
                >
                  Usar huella o rostro en el próximo inicio
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, busy && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={busy}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText} textBreakStrategy="simple">
                    Iniciar sesión
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogle}
              disabled={busy}
            >
              <View style={styles.buttonInner}>
                <Text
                  style={styles.googleButtonText}
                  textBreakStrategy="simple"
                  numberOfLines={2}
                  maxFontSizeMultiplier={1.3}
                >
                  Continuar con Google
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.link}
              onPress={() => router.push("/(auth)/register")}
              disabled={busy}
            >
              <View style={styles.buttonInner}>
                <Text style={styles.linkText} textBreakStrategy="simple">
                  ¿No tienes cuenta? Regístrate
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
      backgroundColor: "rgba(15, 17, 23, 0.45)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 50,
      gap: 12,
    },
    busyOverlayText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      paddingHorizontal: 24,
      textAlign: "center",
    },
    keyboard: {
      flex: 1,
      justifyContent: "center",
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingVertical: 24,
    },
    formContent: {
      alignSelf: "stretch",
    },
    buttonInner: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingVertical: 2,
    },
    header: {
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "700",
      color: colors.primary,
      marginBottom: 8,
      flexShrink: 1,
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 22,
      color: colors.textSecondary,
      flexShrink: 1,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
      marginBottom: 16,
    },
    biometricRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
      paddingRight: 8,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 6,
      marginRight: 10,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    biometricLabel: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      flex: 1,
      minWidth: 0,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      alignItems: "center",
      marginBottom: 12,
      width: "100%",
      overflow: "visible",
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: "#fff",
      fontSize: 17,
      lineHeight: 24,
      fontWeight: "600",
      flexShrink: 1,
      textAlign: "center",
    },
    googleButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      alignItems: "center",
      marginBottom: 24,
      width: "100%",
      overflow: "visible",
    },
    googleButtonText: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
      flexShrink: 1,
      textAlign: "center",
      width: "100%",
    },
    link: {
      alignItems: "center",
      width: "100%",
      overflow: "visible",
    },
    linkText: {
      color: colors.primary,
      fontSize: 15,
      lineHeight: 22,
      flexShrink: 1,
      textAlign: "center",
      width: "100%",
    },
  });
}
