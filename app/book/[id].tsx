import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { AppColorsPalette } from "@/constants/colors";
import { getLevelProgress } from "@/constants/gamification";
import { useAppDialog } from "@/context/AppDialogContext";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { ApiError } from "@/lib/api";
import { deleteBook, getBook, updateBookPages } from "@/lib/books-api";
import { getCelebrationGif, getSuccessCelebrationGif } from "@/lib/giphy-api";
import type { Book } from "@/types/api";

const ESTADO_LABEL: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En lectura",
  read: "Leído",
};

export default function BookDetailScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user, refreshUser } = useAuth();
  const { alert: appAlert } = useAppDialog();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagesInput, setPagesInput] = useState("");
  const [updatingPages, setUpdatingPages] = useState(false);
  const [celebrationGifUrl, setCelebrationGifUrl] = useState<string | null>(
    null,
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successGifUrl, setSuccessGifUrl] = useState<string | null>(null);
  const [successGifLoading, setSuccessGifLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const loadingRef = useRef(false);
  const lastLoadAtRef = useRef(0);
  const MIN_LOAD_INTERVAL_MS = 1500;

  const libroId = id ? parseInt(id, 10) : NaN;

  const load = useCallback(async () => {
    if (!token || isNaN(libroId)) return;
    if (loadingRef.current) return;
    const now = Date.now();
    if (now - lastLoadAtRef.current < MIN_LOAD_INTERVAL_MS) return;
    loadingRef.current = true;
    lastLoadAtRef.current = now;
    setLoading(true);
    try {
      const b = await getBook(token, libroId);
      setBook(b);
      setPagesInput(String(b.pagesRead ?? 0));
    } catch (e) {
      const msg =
        (e instanceof ApiError ? e.message : null) ||
        (e instanceof Error ? e.message : null) ||
        "No se pudo cargar el libro";
      appAlert(
        "No pudimos abrir este libro",
        String(msg).trim() || "Comprueba tu conexión e inténtalo de nuevo.",
        [{ text: "Volver", onPress: () => router.back() }],
        { tone: "error" },
      );
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [token, libroId, router, appAlert]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleUpdatePages = async () => {
    if (!token || !book) return;
    const num = parseInt(pagesInput, 10);
    if (isNaN(num) || num < 0) {
      appAlert(
        "Revisa el número de páginas",
        "Usa un número igual o mayor que 0.",
        undefined,
        { tone: "warning" },
      );
      return;
    }
    setUpdatingPages(true);
    try {
      const updated = await updateBookPages(token, book.bookId, {
        pagesRead: num,
      });
      setBook((prev) => {
        if (!prev) return updated.book;
        return {
          ...prev,
          ...updated.book,
          title: updated.book.title || prev.title,
          author: updated.book.author ?? prev.author,
          imageUrl: updated.book.imageUrl ?? prev.imageUrl,
          description: updated.book.description ?? prev.description,
          totalPages: updated.book.totalPages ?? prev.totalPages,
          isbn: updated.book.isbn ?? prev.isbn,
          genre: updated.book.genre ?? prev.genre,
        };
      });
      await refreshUser();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al actualizar";
      appAlert(
        "No se guardaron las páginas",
        msg,
        undefined,
        { tone: "error" },
      );
      return;
    } finally {
      setUpdatingPages(false);
    }

    try {
      const gif = await getCelebrationGif();
      if (gif?.url) setCelebrationGifUrl(gif.url);
    } catch {
      // GIF opcional
    }

    setShowSuccessModal(true);
    setSuccessGifUrl(null);
    setSuccessGifLoading(true);
    getSuccessCelebrationGif("success")
      .then((res) => {
        if (res?.url) setSuccessGifUrl(res.url);
      })
      .finally(() => setSuccessGifLoading(false));
  };

  const handleDelete = () => {
    if (!token || !book) return;
    appAlert(
      "¿Quitar este libro?",
      `«${book.title}» dejará de aparecer en tu biblioteca. Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Quitar de la biblioteca",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteBook(token, book.bookId);
              router.replace("/(tabs)");
            } catch (e) {
              const msg =
                e instanceof ApiError ? e.message : "No se pudo eliminar";
              appAlert(
                "No pudimos quitar el libro",
                msg,
                undefined,
                { tone: "error" },
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
      { tone: "warning" },
    );
  };

  const handleEdit = () => {
    router.push({
      pathname: "/book/[id]/edit",
      params: { id: String(libroId) },
    });
  };

  if (loading || !book) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalPages = book.totalPages ?? 0;
  const readPages = book.pagesRead ?? 0;
  const progress = totalPages > 0 ? Math.min(1, readPages / totalPages) : 0;
  const statusLabel =
    ESTADO_LABEL[book.readingStatus] ?? book.readingStatus ?? "";
  const hasPagesRegistered = totalPages > 0;

  const xp = user?.xpPoints ?? 0;
  const level = user?.level ?? 1;
  const levelProgress = getLevelProgress(xp);
  const showLevelBlock = hasPagesRegistered && user != null;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {deleting ? (
        <View style={styles.actionBlockingOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.actionBlockingText}>Eliminando de la biblioteca…</Text>
        </View>
      ) : null}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <TouchableOpacity
          style={styles.successOverlay}
          activeOpacity={1}
          onPress={() => setShowSuccessModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.successModalCard}
          >
            {/* Cabecera con acento de color */}
            <View style={styles.successModalHeader}>
              <View style={styles.successModalIconWrap}>
                <Ionicons
                  name="checkmark-circle"
                  size={44}
                  color={colors.surface}
                />
              </View>
              <Text style={styles.successModalHeadline}>¡Bien hecho!</Text>
              <Text style={styles.successModalHeadlineSub}>
                Páginas guardadas
              </Text>
            </View>
            {/* Cuerpo */}
            <View style={styles.successModalBody}>
              <Text style={styles.successModalMessage}>
                Cada página te acerca al final. Sigue así.
              </Text>
              <View style={styles.successGifWrap}>
                {successGifLoading ? (
                  <ActivityIndicator
                    size="large"
                    color={colors.primary}
                    style={styles.successGifPlaceholder}
                  />
                ) : successGifUrl ? (
                  <Image
                    source={{ uri: successGifUrl }}
                    style={styles.successGif}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.successEmojiWrap}>
                    <Text style={styles.successEmoji}>📖</Text>
                    <Text style={styles.successEmojiLabel}>
                      ¡Sigue leyendo!
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.successModalButton}
                onPress={() => setShowSuccessModal(false)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="book-outline"
                  size={20}
                  color={colors.surface}
                  style={styles.successModalButtonIcon}
                />
                <Text style={styles.successModalButtonText}>
                  Seguir leyendo
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Portada y datos principales */}
        <View style={styles.hero}>
          <View style={styles.coverWrap}>
            {book.imageUrl ? (
              <Image
                source={{ uri: book.imageUrl }}
                style={styles.cover}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Text style={styles.coverPlaceholderText}>📖</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>{book.title}</Text>
          {book.author ? <Text style={styles.author}>{book.author}</Text> : null}
          {statusLabel ? (
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>{statusLabel}</Text>
            </View>
          ) : null}
        </View>

        {/* Progreso: con páginas registradas */}
        {hasPagesRegistered && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Progreso de lectura</Text>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {readPages} de {totalPages} páginas
            </Text>
            <View style={styles.pagesRow}>
              <TextInput
                style={styles.pagesInput}
                value={pagesInput}
                onChangeText={setPagesInput}
                keyboardType="number-pad"
                placeholder="0"
                editable={!updatingPages && !deleting}
              />
              <Text style={styles.pagesOf}> / {totalPages}</Text>
              <TouchableOpacity
                style={styles.pagesButton}
                onPress={handleUpdatePages}
                disabled={updatingPages || deleting}
              >
                {updatingPages ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.pagesButtonText}>Actualizar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Avance de nivel (incentivo al actualizar páginas) */}
        {showLevelBlock && (
          <View style={styles.levelBlock}>
            <View style={styles.levelInner}>
              <Text style={styles.levelBlockTitle}>Tu avance</Text>
              <View style={styles.levelStats}>
                <View style={styles.levelStat}>
                  <View style={styles.levelIconWrap}>
                    <Ionicons name="flash" size={22} color={colors.primary} />
                  </View>
                  <Text style={styles.levelValue}>{xp}</Text>
                  <Text style={styles.levelLabel}>XP</Text>
                </View>
                <View style={styles.levelStat}>
                  <View
                    style={[styles.levelIconWrap, styles.levelIconHighlight]}
                  >
                    <Ionicons name="trophy" size={22} color={colors.surface} />
                  </View>
                  <Text style={styles.levelValue}>{level}</Text>
                  <Text style={styles.levelLabel}>Nivel</Text>
                </View>
              </View>
              <View style={styles.levelProgressWrap}>
                <View style={styles.levelProgressTrack}>
                  <View
                    style={[
                      styles.levelProgressFill,
                      { width: `${levelProgress * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.levelProgressText}>
                  {Math.round(levelProgress * 100)}% al siguiente nivel
                </Text>
              </View>
            </View>
            {celebrationGifUrl ? (
              <View style={styles.celebrationWrap}>
                <Text style={styles.celebrationTitle}>¡Sigue así!</Text>
                <Image
                  source={{ uri: celebrationGifUrl }}
                  style={styles.celebrationGif}
                  resizeMode="cover"
                />
              </View>
            ) : null}
          </View>
        )}

        {/* Aviso: sin total de páginas */}
        {!hasPagesRegistered && (
          <View style={styles.cardHint}>
            <Text style={styles.cardHintIcon}>📄</Text>
            <Text style={styles.cardHintTitle}>
              Registra el total de páginas
            </Text>
            <Text style={styles.cardHintText}>
              Añade el número total de páginas del libro para ver tu progreso de
              lectura y la barra de avance.
            </Text>
            <TouchableOpacity
              style={[styles.cardHintButton, deleting && styles.actionDisabled]}
              onPress={handleEdit}
              activeOpacity={0.85}
              disabled={deleting}
            >
              <Text style={styles.cardHintButtonText}>Editar libro</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Descripción */}
        {book.description ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.description}>{book.description}</Text>
          </View>
        ) : null}

        {/* ISBN */}
        {book.isbn ? (
          <View style={styles.cardSmall}>
            <Text style={styles.sectionTitle}>ISBN</Text>
            <Text style={styles.isbn}>{book.isbn}</Text>
          </View>
        ) : null}

        {/* Acciones */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.editButton, deleting && styles.actionDisabled]}
            onPress={handleEdit}
            activeOpacity={0.9}
            disabled={deleting}
          >
            <Text style={styles.editButtonText}>Editar libro</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.actionDisabled]}
            onPress={handleDelete}
            activeOpacity={0.9}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Text style={styles.deleteButtonText}>Eliminar libro</Text>
            )}
          </TouchableOpacity>
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
    actionBlockingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(15, 17, 23, 0.35)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 50,
      gap: 12,
    },
    actionBlockingText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    actionDisabled: {
      opacity: 0.55,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 48,
    },
    hero: {
      alignItems: "center",
      marginBottom: 24,
    },
    coverWrap: {
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: colors.border,
      marginBottom: 16,
      elevation: 0,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    cover: {
      width: 160,
      height: 240,
      backgroundColor: colors.border,
    },
    coverPlaceholder: {
      width: 160,
      height: 240,
      backgroundColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    coverPlaceholderText: {
      fontSize: 56,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 6,
      textAlign: "center",
      paddingHorizontal: 8,
      letterSpacing: 0.2,
      lineHeight: 28,
    },
    author: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 10,
      textAlign: "center",
    },
    statusChip: {
      backgroundColor: colors.primary + "18",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statusChipText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
      letterSpacing: 0.3,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    },
    levelBlock: {
      borderRadius: 20,
      marginBottom: 16,
      overflow: "hidden",
      backgroundColor: colors.primaryDark,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    levelInner: {
      padding: 20,
      paddingVertical: 18,
    },
    levelBlockTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: "rgba(255,255,255,0.9)",
      marginBottom: 14,
      letterSpacing: 0.3,
    },
    levelStats: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    levelStat: {
      alignItems: "center",
      flex: 1,
    },
    levelIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    levelIconHighlight: {
      backgroundColor: colors.primary,
    },
    levelValue: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.surface,
      letterSpacing: -0.5,
    },
    levelLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: "rgba(255,255,255,0.85)",
      marginTop: 2,
    },
    levelProgressWrap: {
      paddingHorizontal: 4,
    },
    levelProgressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: "rgba(255,255,255,0.25)",
      overflow: "hidden",
    },
    levelProgressFill: {
      height: "100%",
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    levelProgressText: {
      fontSize: 11,
      color: "rgba(255,255,255,0.8)",
      marginTop: 8,
      textAlign: "center",
    },
    celebrationWrap: {
      paddingHorizontal: 20,
      paddingBottom: 16,
      alignItems: "center",
    },
    celebrationTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "rgba(255,255,255,0.95)",
      marginBottom: 10,
    },
    celebrationGif: {
      width: 160,
      height: 120,
      borderRadius: 12,
      backgroundColor: "rgba(0,0,0,0.2)",
    },
    successOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    successModalCard: {
      width: "100%",
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderRadius: 28,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.28,
      shadowRadius: 24,
      elevation: 16,
    },
    successModalHeader: {
      backgroundColor: colors.primaryDark,
      paddingTop: 28,
      paddingBottom: 24,
      paddingHorizontal: 24,
      alignItems: "center",
    },
    successModalIconWrap: {
      marginBottom: 12,
      opacity: 0.95,
    },
    successModalHeadline: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.surface,
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    successModalHeadlineSub: {
      fontSize: 14,
      fontWeight: "600",
      color: "rgba(255,255,255,0.88)",
      letterSpacing: 0.2,
    },
    successModalBody: {
      padding: 24,
      paddingTop: 20,
      alignItems: "center",
    },
    successModalMessage: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      textAlign: "center",
      marginBottom: 20,
      paddingHorizontal: 8,
    },
    successGifWrap: {
      width: "100%",
      maxWidth: 240,
      height: 160,
      borderRadius: 20,
      backgroundColor: colors.background,
      marginBottom: 24,
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.primary + "22",
    },
    successGifPlaceholder: {
      margin: 20,
    },
    successGif: {
      width: "100%",
      height: "100%",
    },
    successEmojiWrap: {
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    successEmoji: {
      fontSize: 56,
    },
    successEmojiLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    successModalButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 28,
      borderRadius: 999,
      minWidth: 200,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    successModalButtonIcon: {
      marginRight: 8,
    },
    successModalButtonText: {
      color: colors.surface,
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    cardSmall: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHint: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
      alignItems: "center",
    },
    cardHintIcon: {
      fontSize: 36,
      marginBottom: 12,
    },
    cardHintTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
      textAlign: "center",
    },
    cardHintText: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
      textAlign: "center",
      marginBottom: 18,
      paddingHorizontal: 8,
    },
    cardHintButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 14,
    },
    cardHintButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 12,
      letterSpacing: 0.3,
    },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      overflow: "hidden",
      marginBottom: 8,
    },
    progressFill: {
      height: "100%",
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    progressLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 14,
    },
    pagesRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    pagesInput: {
      width: 72,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    pagesOf: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    pagesButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 12,
    },
    pagesButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    description: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 24,
    },
    isbn: {
      fontSize: 15,
      color: colors.text,
    },
    actions: {
      marginTop: 8,
      gap: 12,
    },
    editButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
    },
    editButtonText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "600",
    },
    deleteButton: {
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: colors.error,
    },
    deleteButtonText: {
      color: colors.error,
      fontSize: 17,
      fontWeight: "600",
    },
  });
}
