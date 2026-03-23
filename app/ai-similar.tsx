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
import { postAiBooksSimilar } from "@/lib/ai-api";
import { getBooks } from "@/lib/books-api";
import type { Book } from "@/types/api";

export default function AiSimilarScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { token } = useAuth();
  const { alert: appAlert } = useAppDialog();
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Book | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [limit, setLimit] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 400);

  const loadBooks = useCallback(async () => {
    if (!token) return;
    setBooksLoading(true);
    try {
      const list = await getBooks(token);
      setBooks(list);
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
    const t = title.trim();
    if (!t) {
      appAlert(
        "Falta el título",
        "El endpoint de libros parecidos requiere título.",
        undefined,
        { tone: "warning" },
      );
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const limitNum = limit.trim() ? parseInt(limit.trim(), 10) : NaN;
      if (limit.trim() && (Number.isNaN(limitNum) || limitNum < 1 || limitNum > 15)) {
        appAlert(
          "Límite no válido",
          "Usa un número entre 1 y 15.",
          undefined,
          { tone: "warning" },
        );
        setLoading(false);
        return;
      }
      const body = {
        title: t,
        ...(author.trim() ? { author: author.trim() } : {}),
        ...(limit.trim() ? { limit: limitNum } : {}),
      };
      const data = await postAiBooksSimilar(token, body);
      setResult(data);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al generar";
      appAlert("No pudimos buscar similares", msg, undefined, {
        tone: "error",
      });
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
        title="Libro de referencia"
        onSelect={(b) => {
          setSelected(b);
          setTitle(b.title);
          setAuthor(b.author ?? "");
          setLimit("");
        }}
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
            title="Libros parecidos"
            subtitle="Usa un libro de tu biblioteca o metadatos sueltos. La IA sugerirá lecturas afines."
          />

          <Text style={styles.sectionLabel}>Desde tu biblioteca</Text>
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
                onPress={() => {
                  setSelected(null);
                }}
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

          <Text style={styles.sectionLabel}>O solo con texto</Text>
          <Text style={styles.hint}>
            Si no eliges de la biblioteca, el título es obligatorio.
          </Text>
          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.inputSingle}
            value={title}
            onChangeText={setTitle}
            placeholder="Título de referencia"
            placeholderTextColor={colors.textSecondary}
            editable={!loading}
          />
          <Text style={styles.label}>Autor (opcional)</Text>
          <TextInput
            style={styles.inputSingle}
            value={author}
            onChangeText={setAuthor}
            placeholder="Autor"
            placeholderTextColor={colors.textSecondary}
            editable={!loading}
          />
          <Text style={styles.label}>Cantidad de resultados (opcional)</Text>
          <TextInput
            style={styles.inputSingle}
            value={limit}
            onChangeText={setLimit}
            placeholder="1 a 15"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
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
              <Text style={styles.buttonText}>Buscar parecidos</Text>
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
    hint: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 12,
      lineHeight: 18,
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
