import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AiResponseView } from "@/components/AiResponseView";
import { AiToolHeader } from "@/components/AiToolHeader";
import type { AppColorsPalette } from "@/constants/colors";
import { useAppDialog } from "@/context/AppDialogContext";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { ApiError } from "@/lib/api";
import { postAiBooksSummary } from "@/lib/ai-api";

export default function AiSummaryScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { token } = useAuth();
  const { alert: appAlert } = useAppDialog();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 400);

  const run = async () => {
    const t = title.trim();
    if (!token) return;
    if (!t) {
      appAlert(
        "Falta el título",
        "Escribe al menos el título del libro.",
        undefined,
        { tone: "warning" },
      );
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await postAiBooksSummary(token, {
        title: t,
        ...(author.trim() ? { author: author.trim() } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      setResult(data);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al generar";
      appAlert("No pudimos generar el resumen", msg, undefined, {
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom: 48 + insets.bottom,
            alignItems: "center",
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: contentWidth }}>
          <AiToolHeader
            title="Resumen y temas"
            subtitle="Ideal cuando aún no tienes el libro en la app: pega o escribe metadatos y obtén un resumen breve y temas."
          />

          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.inputSingle}
            value={title}
            onChangeText={setTitle}
            placeholder="Título del libro"
            placeholderTextColor={colors.textSecondary}
            editable={!loading}
          />

          <Text style={styles.label}>Autor (opcional)</Text>
          <TextInput
            style={styles.inputSingle}
            value={author}
            onChangeText={setAuthor}
            placeholder="Autor o autores"
            placeholderTextColor={colors.textSecondary}
            editable={!loading}
          />

          <Text style={styles.label}>Descripción o sinopsis (opcional)</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Contraportada, notas o lo que tengas"
            placeholderTextColor={colors.textSecondary}
            multiline
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={run}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.buttonText}>Generar resumen</Text>
            )}
          </TouchableOpacity>

          {result != null ? (
            <View style={styles.resultBlock}>
              <Text style={styles.resultHeading}>Resultado</Text>
              <AiResponseView data={result} />
            </View>
          ) : null}
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
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
      marginTop: 4,
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
      minHeight: 120,
      textAlignVertical: "top",
      marginBottom: 16,
    },
    inputSingle: {
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
      alignItems: "center",
      marginTop: 4,
    },
    buttonDisabled: { opacity: 0.75 },
    buttonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "600",
    },
    resultBlock: { marginTop: 28 },
    resultHeading: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.textSecondary,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  });
}
