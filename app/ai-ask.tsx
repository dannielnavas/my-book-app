import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
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
import { BookPickerModal } from "@/components/BookPickerModal";
import type { AppColorsPalette } from "@/constants/colors";
import { useAppDialog } from "@/context/AppDialogContext";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { ApiError } from "@/lib/api";
import { postAiBooksAsk } from "@/lib/ai-api";
import { getBooks } from "@/lib/books-api";
import type { Book } from "@/types/api";

export default function AiAskScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { token } = useAuth();
  const { alert: appAlert } = useAppDialog();
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Book | null>(null);
  const [question, setQuestion] = useState("");
  const [contextText, setContextText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 400);

  const loadBooks = useCallback(async () => {
    if (!token) return;
    setBooksLoading(true);
    try {
      setBooks(await getBooks(token));
    } catch {
      setBooks([]);
    } finally {
      setBooksLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadBooks();
    }, [loadBooks]),
  );

  const run = async () => {
    if (!token) return;
    const q = question.trim();
    if (!q) {
      appAlert(
        "Escribe una pregunta",
        "Necesitamos al menos la pregunta para consultar a la IA.",
        undefined,
        { tone: "warning" },
      );
      return;
    }
    if (!selected && !contextText.trim()) {
      appAlert(
        "Añade contexto",
        "Elige un libro de tu biblioteca o pega un fragmento en “Texto de contexto”.",
        undefined,
        { tone: "warning" },
      );
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await postAiBooksAsk(token, {
        question: q,
        ...(selected ? { bookId: selected.bookId } : {}),
        ...(contextText.trim() ? { context: contextText.trim() } : {}),
      });
      setResult(data);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al generar";
      appAlert("No pudimos responder", msg, undefined, { tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <BookPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        books={books}
        loading={booksLoading}
        title="Libro de contexto"
        onSelect={(b) => setSelected(b)}
      />
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
            title="Preguntar al libro"
            subtitle="Necesitas contexto: un libro de tu biblioteca o un texto que pegues. Luego formula tu pregunta."
          />

          <Text style={styles.sectionLabel}>Contexto del libro</Text>
          {selected ? (
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipTitle} numberOfLines={2}>
                  {selected.title}
                </Text>
                {selected.author ? (
                  <Text style={styles.chipMeta} numberOfLines={1}>
                    {selected.author}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => setSelected(null)}
                style={styles.chipClear}
                accessibilityRole="button"
                accessibilityLabel="Quitar libro seleccionado"
              >
                <Text style={styles.chipClearText}>Quitar</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setPickerOpen(true)}
            disabled={loading}
          >
            <Text style={styles.secondaryBtnText}>
              {selected ? "Cambiar libro" : "Elegir de mi biblioteca"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Texto de contexto (si no hay libro)</Text>
          <TextInput
            style={styles.input}
            value={contextText}
            onChangeText={setContextText}
            placeholder="Pega un fragmento, sinopsis o notas. Puedes combinarlo con un libro si quieres."
            placeholderTextColor={colors.textSecondary}
            multiline
            editable={!loading}
          />

          <Text style={styles.label}>Tu pregunta</Text>
          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="Ej.: ¿Qué personaje representa la ambición?"
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
              <Text style={styles.buttonText}>Preguntar</Text>
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
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginTop: 8,
      marginBottom: 10,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
      marginTop: 4,
    },
    chipRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: 12,
    },
    chip: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    chipMeta: {
      marginTop: 4,
      fontSize: 14,
      color: colors.textSecondary,
    },
    chipClear: {
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    chipClearText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },
    secondaryBtn: {
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: 20,
    },
    secondaryBtnText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
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
      minHeight: 100,
      textAlignVertical: "top",
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
