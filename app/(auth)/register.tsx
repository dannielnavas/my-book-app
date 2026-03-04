import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import type { AppColorsPalette } from "@/constants/colors";
import { AuthApiError, useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { register } = useAuth();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nombre.trim() || !email.trim() || !password) {
      Alert.alert("Error", "Completa nombre, email y contraseña");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      await register(nombre.trim(), email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      const msg =
        e instanceof AuthApiError ? e.message : "Error al registrarse";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = width - 48 - insets.left - insets.right;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { minWidth: contentWidth },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.formContent, { width: contentWidth }]}>
            <View style={styles.header}>
              <Text style={styles.title} textBreakStrategy="simple">
                Crear cuenta
              </Text>
              <Text style={styles.subtitle} textBreakStrategy="simple">
                Regístrate en Mi Libro App
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor={colors.textSecondary}
              value={nombre}
              onChangeText={setNombre}
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña (mín. 6 caracteres)"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText} textBreakStrategy="simple">
                    Registrarme
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.link}
              onPress={() => router.back()}
              disabled={loading}
            >
              <View style={styles.buttonInner}>
                <Text style={styles.linkText} textBreakStrategy="simple">
                  ¿Ya tienes cuenta? Inicia sesión
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
    keyboard: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: "center",
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingVertical: 24,
    },
    formContent: {
      overflow: "visible",
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
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    buttonInner: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
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
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      alignItems: "center",
      marginBottom: 24,
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
      textAlign: "center",
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
      textAlign: "center",
      width: "100%",
    },
  });
}
