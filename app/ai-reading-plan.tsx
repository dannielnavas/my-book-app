import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
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
import { postAiBooksReadingPlan } from "@/lib/ai-api";
import { ApiError } from "@/lib/api";
import { getBooks } from "@/lib/books-api";
import type { Book } from "@/types/api";

type ReadingPlanDay = {
  label: string;
  suggestion: string;
};

type ReadingPlanVisual = {
  planTitle: string;
  notes?: string;
  totalEstimatedDays?: number | null;
  days: ReadingPlanDay[];
};

type SavedReadingPlan = {
  id: string;
  savedAt: string;
  sourceTitle: string;
  payload: ReadingPlanVisual;
};

function readingPlanStorageKey(userId?: number): string {
  return `milibro_reading_plans:${userId ?? 0}`;
}

function normalizeReadingPlan(data: unknown): ReadingPlanVisual | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const root = data as Record<string, unknown>;
  const daysRaw = Array.isArray(root.days) ? root.days : [];
  const days: ReadingPlanDay[] = daysRaw
    .map((d, index) => {
      if (!d || typeof d !== "object" || Array.isArray(d)) return null;
      const day = d as Record<string, unknown>;
      const label =
        (typeof day.label === "string" && day.label.trim()) ||
        (typeof day.day === "string" && day.day.trim()) ||
        `Paso ${index + 1}`;
      const suggestion =
        (typeof day.suggestion === "string" && day.suggestion.trim()) ||
        (typeof day.text === "string" && day.text.trim()) ||
        (typeof day.detail === "string" && day.detail.trim()) ||
        "";
      if (!suggestion) return null;
      return { label: String(label), suggestion: String(suggestion) };
    })
    .filter((v): v is ReadingPlanDay => Boolean(v));

  if (days.length === 0) return null;

  return {
    planTitle:
      (typeof root.planTitle === "string" && root.planTitle.trim()) ||
      "Tu plan de lectura",
    notes: typeof root.notes === "string" ? root.notes : undefined,
    totalEstimatedDays:
      typeof root.totalEstimatedDays === "number" ? root.totalEstimatedDays : null,
    days,
  };
}

export default function AiReadingPlanScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { token, user } = useAuth();
  const { alert: appAlert } = useAppDialog();
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Book | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [savedPlans, setSavedPlans] = useState<SavedReadingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
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

  const loadSavedPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const raw = await SecureStore.getItemAsync(readingPlanStorageKey(user?.id));
      if (!raw) {
        setSavedPlans([]);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        setSavedPlans([]);
        return;
      }
      const safe = parsed.filter(
        (p) =>
          p &&
          typeof p === "object" &&
          !Array.isArray(p) &&
          typeof (p as { id?: unknown }).id === "string",
      ) as SavedReadingPlan[];
      setSavedPlans(safe);
    } catch {
      setSavedPlans([]);
    } finally {
      setPlansLoading(false);
    }
  }, [user?.id]);

  const persistPlans = useCallback(
    async (plans: SavedReadingPlan[]) => {
      await SecureStore.setItemAsync(
        readingPlanStorageKey(user?.id),
        JSON.stringify(plans),
      );
      setSavedPlans(plans);
    },
    [user?.id],
  );

  useFocusEffect(
    useCallback(() => {
      loadBooks();
      loadSavedPlans();
    }, [loadBooks, loadSavedPlans]),
  );

  const run = async () => {
    if (!token) return;
    const t = title.trim();
    if (!selected && !t) {
      appAlert(
        "Indica un libro",
        "Elige uno de tu biblioteca o escribe al menos el título.",
        undefined,
        { tone: "warning" },
      );
      return;
    }
    const pagesNum = totalPages.trim() ? parseInt(totalPages.trim(), 10) : NaN;
    const pagesOk =
      !totalPages.trim() || (!Number.isNaN(pagesNum) && pagesNum >= 1);
    if (!pagesOk) {
      appAlert(
        "Páginas no válidas",
        "Si indicas extensión, usa un número entero ≥ 1.",
        undefined,
        { tone: "warning" },
      );
      return;
    }
    const constraintsText = description.trim();
    if (constraintsText.length > 500) {
      appAlert(
        "Texto demasiado largo",
        "Las restricciones o contexto deben tener máximo 500 caracteres.",
        undefined,
        { tone: "warning" },
      );
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const selectedBookId = selected ? Number(selected.bookId) : NaN;
      if (
        selected &&
        (!Number.isInteger(selectedBookId) || selectedBookId < 1)
      ) {
        appAlert(
          "Libro inválido",
          "No pudimos leer el identificador del libro seleccionado.",
          undefined,
          { tone: "warning" },
        );
        setLoading(false);
        return;
      }
      const body = selected
        ? {
            bookId: selectedBookId,
            ...(constraintsText ? { constraints: constraintsText } : {}),
          }
        : {
            title: t,
            ...(author.trim() ? { author: author.trim() } : {}),
            ...(constraintsText ? { constraints: constraintsText } : {}),
            ...(!Number.isNaN(pagesNum) && totalPages.trim()
              ? { totalPages: pagesNum }
              : {}),
          };
      const data = await postAiBooksReadingPlan(token, body);
      setResult(data);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al generar";
      appAlert("No pudimos crear el plan", msg, undefined, {
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const visualPlan = useMemo(() => normalizeReadingPlan(result), [result]);

  const saveCurrentPlan = useCallback(async () => {
    if (!visualPlan) {
      appAlert(
        "No hay plan para guardar",
        "Genera primero un plan de lectura.",
        undefined,
        { tone: "warning" },
      );
      return;
    }
    setSavingPlan(true);
    try {
      const nowIso = new Date().toISOString();
      const sourceTitle = selected?.title || title.trim() || visualPlan.planTitle;
      const newItem: SavedReadingPlan = {
        id: `${Date.now()}`,
        savedAt: nowIso,
        sourceTitle,
        payload: visualPlan,
      };
      const next = [newItem, ...savedPlans].slice(0, 20);
      await persistPlans(next);
      appAlert(
        "Plan guardado en tu teléfono",
        "Puedes volver a abrirlo desde “Planes guardados”.",
        undefined,
        { tone: "success" },
      );
    } catch {
      appAlert(
        "No se pudo guardar",
        "Inténtalo de nuevo en unos segundos.",
        undefined,
        { tone: "error" },
      );
    } finally {
      setSavingPlan(false);
    }
  }, [appAlert, persistPlans, savedPlans, selected?.title, title, visualPlan]);

  const openSavedPlan = useCallback((item: SavedReadingPlan) => {
    setResult({
      planTitle: item.payload.planTitle,
      notes: item.payload.notes ?? null,
      totalEstimatedDays: item.payload.totalEstimatedDays ?? null,
      days: item.payload.days,
    });
  }, []);

  const deleteSavedPlan = useCallback(
    async (id: string) => {
      const next = savedPlans.filter((p) => p.id !== id);
      await persistPlans(next);
    },
    [persistPlans, savedPlans],
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <BookPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        books={books}
        loading={booksLoading}
        title="Libro para el plan"
        onSelect={(b) => {
          setSelected(b);
          setTitle(b.title);
          setAuthor(b.author ?? "");
          setDescription(b.description?.slice(0, 400) ?? "");
          setTotalPages(b.totalPages != null ? String(b.totalPages) : "");
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
            title="Plan de lectura"
            subtitle="Recibe pasos o un calendario sugerido. Puedes anclarlo a un libro de tu biblioteca o solo a metadatos."
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

          <Text style={styles.sectionLabel}>Metadatos</Text>
          <Text style={styles.hint}>
            Sin libro de la biblioteca, el título es obligatorio.
          </Text>
          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.inputSingle}
            value={title}
            onChangeText={setTitle}
            placeholder="Título"
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
          <Text style={styles.label}>Páginas totales (opcional)</Text>
          <TextInput
            style={styles.inputSingle}
            value={totalPages}
            onChangeText={setTotalPages}
            placeholder="Ej. 320"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            editable={!loading}
          />
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={styles.input}
            value={description.slice(0, 400)}
            onChangeText={(text) => setDescription(text.slice(0, 400))}
            placeholder="Contexto o objetivo (terminar en 2 semanas, etc.)"
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
              <Text style={styles.buttonText}>Generar plan</Text>
            )}
          </TouchableOpacity>

          {visualPlan ? (
            <View style={styles.resultBlock}>
              <Text style={styles.resultHeading}>Tu plan</Text>
              <View style={styles.planHeaderCard}>
                <Text style={styles.planTitle}>{visualPlan.planTitle}</Text>
                {typeof visualPlan.totalEstimatedDays === "number" ? (
                  <Text style={styles.planMeta}>
                    Estimado: {visualPlan.totalEstimatedDays} días
                  </Text>
                ) : null}
                {visualPlan.notes ? (
                  <Text style={styles.planNotes}>{visualPlan.notes}</Text>
                ) : null}
              </View>

              <View style={styles.timelineWrap}>
                {visualPlan.days.map((day, idx) => (
                  <View key={`${day.label}-${idx}`} style={styles.timelineRow}>
                    <View style={styles.timelineBullet} />
                    <View style={styles.timelineCard}>
                      <Text style={styles.timelineLabel}>{day.label}</Text>
                      <Text style={styles.timelineText}>{day.suggestion}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.secondaryBtn,
                  styles.saveBtn,
                  savingPlan && styles.buttonDisabled,
                ]}
                onPress={saveCurrentPlan}
                disabled={savingPlan}
              >
                <Text style={styles.secondaryBtnText}>
                  {savingPlan ? "Guardando..." : "Guardar en este teléfono"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : result != null ? (
            <View style={styles.resultBlock}>
              <Text style={styles.resultHeading}>Resultado</Text>
              <AiResponseView data={result} />
            </View>
          ) : null}

          <View style={styles.savedBlock}>
            <Text style={styles.resultHeading}>Planes guardados</Text>
            {plansLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : savedPlans.length === 0 ? (
              <Text style={styles.emptySavedText}>
                Aún no has guardado planes en este dispositivo.
              </Text>
            ) : (
              savedPlans.map((item) => (
                <View key={item.id} style={styles.savedCard}>
                  <Text style={styles.savedTitle} numberOfLines={2}>
                    {item.sourceTitle}
                  </Text>
                  <Text style={styles.savedMeta}>
                    {new Date(item.savedAt).toLocaleString()}
                  </Text>
                  <View style={styles.savedActions}>
                    <TouchableOpacity
                      onPress={() => openSavedPlan(item)}
                      style={styles.savedActionBtn}
                    >
                      <Text style={styles.savedActionText}>Abrir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteSavedPlan(item.id)}
                      style={styles.savedActionBtn}
                    >
                      <Text style={[styles.savedActionText, { color: colors.error }]}>
                        Eliminar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
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
    planHeaderCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
    },
    planTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 4,
    },
    planMeta: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: "600",
      marginBottom: 8,
    },
    planNotes: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    timelineWrap: {
      gap: 10,
    },
    timelineRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    timelineBullet: {
      marginTop: 8,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    timelineCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
    },
    timelineLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 6,
    },
    timelineText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    saveBtn: {
      marginTop: 14,
      marginBottom: 0,
    },
    savedBlock: {
      marginTop: 24,
      marginBottom: 24,
    },
    emptySavedText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    savedCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
    },
    savedTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    savedMeta: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 10,
    },
    savedActions: {
      flexDirection: "row",
      gap: 8,
    },
    savedActionBtn: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    savedActionText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
  });
}
