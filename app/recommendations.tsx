import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import type { AppColorsPalette } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { createRecommendation } from "@/lib/ai-api";
import { ApiError } from "@/lib/api";

/**
 * Pantalla de recomendaciones IA.
 * Cuando la app integre un servicio de IA real, aquí se enviaría el prompt,
 * se recibiría la respuesta y se llamaría a createRecommendation con los datos.
 * Por ahora permite guardar un registro de ejemplo para consumir el endpoint.
 */
export default function RecommendationsScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { token } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = width - 48 - insets.left - insets.right;

  const handleSaveExample = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await createRecommendation(token, {
        promptSent: prompt.trim() || "Recomiéndame libros de ficción",
        aiResponseJson: {
          libros: ["Ejemplo 1", "Ejemplo 2"],
          total: 2,
        },
        aiModel: "gpt-4",
      });
      Alert.alert("Guardado", "Recomendación registrada en el historial.");
      setPrompt("");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al guardar";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { minWidth: contentWidth, paddingTop: insets.top + 16 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Recomendaciones IA</Text>
        <Text style={styles.subtitle}>
          Cuando la app genere o muestre recomendaciones (con un servicio de IA
          integrado), se guardarán aquí en el backend.
        </Text>
        <Text style={styles.label}>Prompt (opcional, para prueba)</Text>
        <TextInput
          style={styles.input}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Ej: Recomiéndame libros de realismo mágico"
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSaveExample}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              Guardar recomendación de ejemplo
            </Text>
          )}
        </TouchableOpacity>
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
      padding: 24,
      paddingBottom: 48,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: 24,
      lineHeight: 22,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      minHeight: 80,
      textAlignVertical: "top",
      marginBottom: 20,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "600",
    },
  });
}
