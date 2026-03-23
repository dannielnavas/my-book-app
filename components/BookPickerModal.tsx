import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { AppColorsPalette } from "@/constants/colors";
import { useAppColors } from "@/hooks/use-app-colors";
import type { Book } from "@/types/api";

export function BookPickerModal({
  visible,
  onClose,
  books,
  loading,
  onSelect,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  books: Book[];
  loading: boolean;
  onSelect: (book: Book) => void;
  title: string;
}) {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.hint}>Cargando tu biblioteca…</Text>
          </View>
        ) : (
          <FlatList
            data={books}
            keyExtractor={(b) => String(b.bookId)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons
                  name="book-outline"
                  size={40}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyTitle}>Aún no hay libros</Text>
                <Text style={styles.emptyText}>
                  Añade un libro a tu biblioteca para elegirlo aquí.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                activeOpacity={0.75}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.author ? (
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {item.author}
                    </Text>
                  ) : null}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

function createStyles(colors: AppColorsPalette) {
  return StyleSheet.create({
    sheet: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 8,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sheetTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      flex: 1,
      paddingRight: 8,
    },
    closeBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    list: { paddingBottom: 32 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    rowMeta: {
      marginTop: 4,
      fontSize: 14,
      color: colors.textSecondary,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: 24,
    },
    hint: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    empty: {
      padding: 40,
      alignItems: "center",
      gap: 8,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      marginTop: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
  });
}
