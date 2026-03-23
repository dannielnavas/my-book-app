import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AppColorsPalette } from "@/constants/colors";
import { useAppDialog } from "@/context/AppDialogContext";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { ApiError } from "@/lib/api";
import { getBooks } from "@/lib/books-api";
import type { Book } from "@/types/api";

const ESTADO_LABEL: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En lectura",
  read: "Leído",
};

const TAB_BAR_HEIGHT = 56;
const BOOKS_SORT_KEY_PREFIX = "milibro_books_sort_";
const BOOKS_GROUPS_KEY_PREFIX = "milibro_book_groups_";

type BooksSortMode = "default" | "title" | "author";

type CustomGroup = {
  id: string;
  name: string;
  bookIds: number[];
};

export default function BibliotecaScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const { alert: appAlert } = useAppDialog();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<BooksSortMode>("default");
  const [groupByAuthor, setGroupByAuthor] = useState(false);
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [groupModalBookId, setGroupModalBookId] = useState<number | null>(null);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fabBottom = insets.bottom + TAB_BAR_HEIGHT + 12;

  const storageKey = useMemo(
    () => `${BOOKS_SORT_KEY_PREFIX}${user?.id ?? "default"}`,
    [user?.id],
  );

  const groupsStorageKey = useMemo(
    () => `${BOOKS_GROUPS_KEY_PREFIX}${user?.id ?? "default"}`,
    [user?.id],
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(storageKey);
        if (!isMounted || !stored) return;
        if (stored === "default" || stored === "title" || stored === "author") {
          setSortMode(stored);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(groupsStorageKey);
        if (!isMounted || !stored) return;
        const parsed = JSON.parse(stored) as CustomGroup[];
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .map((g) => ({
              ...g,
              bookIds: Array.isArray(g.bookIds) ? g.bookIds : [],
            }))
            .filter((g) => g.bookIds.length > 0);
          setCustomGroups(normalized);
          if (normalized.length < parsed.length && isMounted) {
            SecureStore.setItemAsync(
              groupsStorageKey,
              JSON.stringify(normalized),
            ).catch(() => {});
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [groupsStorageKey]);

  const sortedBooks = useMemo(() => {
    if (sortMode === "default") {
      return books;
    }
    const arr = [...books];
    if (sortMode === "title") {
      arr.sort((a, b) =>
        (a.title ?? "").localeCompare(b.title ?? "", "es", {
          sensitivity: "base",
        }),
      );
    } else if (sortMode === "author") {
      arr.sort((a, b) =>
        (a.author ?? "").localeCompare(b.author ?? "", "es", {
          sensitivity: "base",
        }),
      );
    }
    return arr;
  }, [books, sortMode]);

  const filteredBooks = useMemo(() => {
    let source = sortedBooks;

    if (selectedGroupId) {
      const group = customGroups.find((g) => g.id === selectedGroupId);
      if (group) {
        const ids = new Set(group.bookIds);
        source = source.filter((b) => b.bookId != null && ids.has(b.bookId));
      }
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return source;
    return source.filter((b) => {
      const titulo = (b.title ?? "").toLowerCase();
      const autor = (b.author ?? "").toLowerCase();
      return titulo.includes(q) || autor.includes(q);
    });
  }, [sortedBooks, searchQuery, selectedGroupId, customGroups]);

  const groupedByAuthor = useMemo(() => {
    if (!groupByAuthor) return null;
    const map = new Map<string, Book[]>();
    filteredBooks.forEach((b) => {
      const rawAuthor = (b.author ?? "").trim();
      const author = rawAuthor.length > 0 ? rawAuthor : "Sin autor";
      const current = map.get(author);
      if (current) {
        current.push(b);
      } else {
        map.set(author, [b]);
      }
    });
    return Array.from(map.entries())
      .sort(([a], [b]) =>
        a.localeCompare(b, "es", {
          sensitivity: "base",
        }),
      )
      .map(([author, data]) => ({ title: author, data }));
  }, [filteredBooks, groupByAuthor]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const list = await getBooks(token);
      setBooks(list);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Error al cargar la biblioteca";
      appAlert(
        "No pudimos cargar tu biblioteca",
        String(msg).trim(),
        undefined,
        { tone: "error" },
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, appAlert]);

  useEffect(() => {
    load();
  }, [load]);

  const persistGroups = useCallback(
    async (groups: CustomGroup[]) => {
      const filtered = groups.filter((g) => g.bookIds.length > 0);
      setCustomGroups(filtered);
      setSelectedGroupId((current) => {
        const keptIds = new Set(filtered.map((g) => g.id));
        return current != null && keptIds.has(current) ? current : null;
      });
      try {
        await SecureStore.setItemAsync(
          groupsStorageKey,
          JSON.stringify(filtered),
        );
      } catch {
        // ignore
      }
    },
    [groupsStorageKey],
  );

  const persistSortMode = useCallback(
    async (mode: BooksSortMode) => {
      setSortMode(mode);
      try {
        await SecureStore.setItemAsync(storageKey, mode);
      } catch {
        // ignore
      }
    },
    [storageKey],
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const onBookPress = useCallback(
    (libroId: number) => {
      router.push({ pathname: "/book/[id]", params: { id: String(libroId) } });
    },
    [router],
  );

  const openGroupModalForBook = useCallback((bookId: number) => {
    setGroupModalBookId(bookId);
    setGroupNameInput("");
    setGroupModalVisible(true);
  }, []);

  const closeGroupModal = useCallback(() => {
    setGroupModalVisible(false);
    setGroupModalBookId(null);
    setGroupNameInput("");
  }, []);

  const handleToggleGroupMembership = useCallback(
    (groupId: string) => {
      if (groupModalBookId == null) return;
      const next = customGroups.map((g) => {
        if (g.id !== groupId) return g;
        const has = g.bookIds.includes(groupModalBookId);
        return {
          ...g,
          bookIds: has
            ? g.bookIds.filter((id) => id !== groupModalBookId)
            : [...g.bookIds, groupModalBookId],
        };
      });
      persistGroups(next);
    },
    [customGroups, groupModalBookId, persistGroups],
  );

  const handleCreateGroupAndAdd = useCallback(() => {
    const name = groupNameInput.trim();
    if (!name || groupModalBookId == null) {
      closeGroupModal();
      return;
    }
    const existing = customGroups.find(
      (g) => g.name.toLowerCase() === name.toLowerCase(),
    );
    let next: CustomGroup[];
    if (existing) {
      next = customGroups.map((g) =>
        g.id === existing.id
          ? {
              ...g,
              bookIds: g.bookIds.includes(groupModalBookId)
                ? g.bookIds
                : [...g.bookIds, groupModalBookId],
            }
          : g,
      );
    } else {
      const newGroup: CustomGroup = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        bookIds: [groupModalBookId],
      };
      next = [...customGroups, newGroup];
    }
    persistGroups(next);
    closeGroupModal();
  }, [
    groupNameInput,
    groupModalBookId,
    customGroups,
    persistGroups,
    closeGroupModal,
  ]);

  const createListModalPrimaryLabel = useMemo(() => {
    const name = groupNameInput.trim();
    if (!name) return "Crear lista";
    const existing = customGroups.find(
      (g) => g.name.toLowerCase() === name.toLowerCase(),
    );
    return existing ? "Agregar a lista" : "Crear lista";
  }, [groupNameInput, customGroups]);

  const listsByBookId = useMemo(() => {
    const map = new Map<number, CustomGroup[]>();
    for (const g of customGroups) {
      for (const bid of g.bookIds) {
        const prev = map.get(bid);
        if (prev) prev.push(g);
        else map.set(bid, [g]);
      }
    }
    return map;
  }, [customGroups]);

  const removeBookFromList = useCallback(
    (groupId: string, bookId: number) => {
      const next = customGroups.map((g) =>
        g.id === groupId
          ? { ...g, bookIds: g.bookIds.filter((id) => id !== bookId) }
          : g,
      );
      persistGroups(next);
    },
    [customGroups, persistGroups],
  );

  const renderBookCard = useCallback(
    (item: Book) => {
      const total = item.totalPages ?? 0;
      const read = item.pagesRead ?? 0;
      const progress = total > 0 ? Math.min(1, read / total) : 0;
      const statusLabel =
        ESTADO_LABEL[item.readingStatus] ?? item.readingStatus ?? "";
      const listsForBook =
        item.bookId != null ? listsByBookId.get(item.bookId) ?? [] : [];

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => item.bookId != null && onBookPress(item.bookId)}
          activeOpacity={0.92}
        >
          <View style={styles.coverWrap}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.cover}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Text style={styles.coverPlaceholderText}>📖</Text>
              </View>
            )}
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title || "Sin título"}
              </Text>
              {item.bookId != null && listsForBook.length === 0 ? (
                <TouchableOpacity
                  style={styles.groupIconButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => openGroupModalForBook(item.bookId!)}
                >
                  <Ionicons
                    name="folder-open-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
            {item.author ? (
              <Text style={styles.author} numberOfLines={1}>
                {item.author}
              </Text>
            ) : null}
            {listsForBook.length > 0 ? (
              <View style={styles.bookListsRow}>
                {listsForBook.map((g) => (
                  <View key={g.id} style={styles.bookListChip}>
                    <Text style={styles.bookListChipText} numberOfLines={1}>
                      {g.name}
                    </Text>
                    <TouchableOpacity
                      style={styles.bookListChipRemove}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      onPress={() =>
                        item.bookId != null &&
                        removeBookFromList(g.id, item.bookId)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Quitar de la lista ${g.name}`}
                    >
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}
            {statusLabel ? (
              <View style={styles.statusChip}>
                <Text style={styles.statusChipText}>{statusLabel}</Text>
              </View>
            ) : null}
            {total > 0 && (
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progress * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.pages}>
                  {read} / {total}{" "}
                  <Text style={styles.pagesLabel}>págs.</Text>
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [
      styles,
      colors.textSecondary,
      onBookPress,
      openGroupModalForBook,
      listsByBookId,
      removeBookFromList,
    ],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const showEmptySearch = searchQuery.trim() && filteredBooks.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <Ionicons
          name="search"
          size={20}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por título o autor..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => setSearchQuery("")}
            style={styles.searchClear}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFiltersVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="options-outline"
            size={22}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      {groupByAuthor ? (
        <SectionList
          sections={groupedByAuthor ?? []}
          keyExtractor={(item, index) =>
            `book-${item.bookId ?? index}-${index}`
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Text style={styles.emptyIcon}>
                  {showEmptySearch ? "🔍" : "📚"}
                </Text>
              </View>
              <Text style={styles.emptyTitle}>
                {showEmptySearch
                  ? "No hay resultados"
                  : "Tu biblioteca está vacía"}
              </Text>
              <Text style={styles.emptyText}>
                {showEmptySearch
                  ? `Ningún libro coincide con "${searchQuery.trim()}"`
                  : "Toca el botón + para añadir tu primer libro"}
              </Text>
              {!showEmptySearch && (
                <Text style={styles.emptySubtext}>
                  Tap the + button to add your first book
                </Text>
              )}
            </View>
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => renderBookCard(item)}
        />
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={(item, index) =>
            `book-${item.bookId ?? index}-${index}`
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Text style={styles.emptyIcon}>
                  {showEmptySearch ? "🔍" : "📚"}
                </Text>
              </View>
              <Text style={styles.emptyTitle}>
                {showEmptySearch
                  ? "No hay resultados"
                  : "Tu biblioteca está vacía"}
              </Text>
              <Text style={styles.emptyText}>
                {showEmptySearch
                  ? `Ningún libro coincide con "${searchQuery.trim()}"`
                  : "Toca el botón + para añadir tu primer libro"}
              </Text>
              {!showEmptySearch && (
                <Text style={styles.emptySubtext}>
                  Tap the + button to add your first book
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => renderBookCard(item)}
        />
      )}
      <Modal
        visible={filtersVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFiltersVisible(false)}
        style={styles.modal}
      >
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity
            style={styles.sidebarBackdrop}
            activeOpacity={1}
            onPress={() => setFiltersVisible(false)}
          />
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Filtros y listas</Text>
              <TouchableOpacity
                onPress={() => setFiltersVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionLabel}>Ordenar</Text>
              <View style={styles.sidebarChipsRow}>
                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    sortMode === "default" && styles.sortChipActive,
                  ]}
                  onPress={() => persistSortMode("default")}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      sortMode === "default" && styles.sortChipTextActive,
                    ]}
                  >
                    Recientes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    sortMode === "title" && styles.sortChipActive,
                  ]}
                  onPress={() => persistSortMode("title")}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      sortMode === "title" && styles.sortChipTextActive,
                    ]}
                  >
                    Título A-Z
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    sortMode === "author" && styles.sortChipActive,
                  ]}
                  onPress={() => persistSortMode("author")}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      sortMode === "author" && styles.sortChipTextActive,
                    ]}
                  >
                    Autor A-Z
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionLabel}>Agrupar</Text>
              <View style={styles.sidebarChipsRow}>
                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    groupByAuthor && styles.sortChipActive,
                  ]}
                  onPress={() => setGroupByAuthor((prev) => !prev)}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      groupByAuthor && styles.sortChipTextActive,
                    ]}
                  >
                    Agrupar por autor
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {customGroups.length > 0 && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarSectionLabel}>Listas</Text>
                <View style={styles.sidebarGroupsWrap}>
                  <TouchableOpacity
                    style={[
                      styles.sortChip,
                      !selectedGroupId && styles.sortChipActive,
                    ]}
                    onPress={() => setSelectedGroupId(null)}
                  >
                    <Text
                      style={[
                        styles.sortChipText,
                        !selectedGroupId && styles.sortChipTextActive,
                      ]}
                    >
                      Todos
                    </Text>
                  </TouchableOpacity>
                  {customGroups.map((group) => {
                    const isActive = selectedGroupId === group.id;
                    return (
                      <TouchableOpacity
                        key={group.id}
                        style={[
                          styles.sortChip,
                          isActive && styles.sortChipActive,
                        ]}
                        onPress={() =>
                          setSelectedGroupId((current) =>
                            current === group.id ? null : group.id,
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.sortChipText,
                            isActive && styles.sortChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {group.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        visible={groupModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeGroupModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Añadir a una lista</Text>
            {groupModalBookId == null ? null : (
              <>
                {customGroups.length > 0 ? (
                  <>
                    <Text style={styles.modalSectionLabel}>
                      Selecciona una lista ya creada
                    </Text>
                    <Text style={styles.modalHint}>
                      Toca para añadir o quitar este libro de la lista.
                    </Text>
                    <View style={styles.modalGroupsList}>
                      {customGroups.map((group) => {
                        const isInGroup =
                          group.bookIds.includes(groupModalBookId);
                        return (
                          <TouchableOpacity
                            key={group.id}
                            style={[
                              styles.modalGroupItem,
                              isInGroup && styles.modalGroupItemActive,
                            ]}
                            onPress={() => {
                              handleToggleGroupMembership(group.id);
                              setGroupNameInput(group.name);
                            }}
                          >
                            <Text
                              style={[
                                styles.modalGroupItemText,
                                isInGroup && styles.modalGroupItemTextActive,
                              ]}
                            >
                              {group.name}
                            </Text>
                            {isInGroup ? (
                              <Ionicons
                                name="checkmark-circle"
                                size={22}
                                color={colors.primary}
                              />
                            ) : (
                              <View style={styles.modalGroupItemDot} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                ) : null}
                <Text style={styles.modalSectionLabel}>
                  O crea una nueva lista
                </Text>
                <View style={styles.modalInputWrap}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Nombre de la nueva lista"
                    placeholderTextColor={colors.textSecondary}
                    value={groupNameInput}
                    onChangeText={setGroupNameInput}
                    autoCapitalize="sentences"
                  />
                </View>
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={closeGroupModal}
                  >
                    <Text style={styles.modalButtonSecondaryText}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={handleCreateGroupAndAdd}
                  >
                    <Text style={styles.modalButtonPrimaryText}>
                      {createListModalPrimaryLabel}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      <TouchableOpacity
        style={[styles.fab, { bottom: fabBottom }]}
        onPress={() => router.push("/(tabs)/add")}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: AppColorsPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginTop: 12,
      marginBottom: 8,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      minHeight: 44,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      paddingVertical: 10,
    },
    searchClear: {
      padding: 4,
    },
    filterButton: {
      marginLeft: 4,
      padding: 4,
    },
    sortRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginTop: 4,
    },
    sortSpacer: {
      flex: 1,
    },
    groupRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      marginHorizontal: 20,
      marginTop: 8,
    },
    sortChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginRight: 8,
    },
    sortChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "18",
    },
    sortChipText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    sortChipTextActive: {
      color: colors.primary,
    },
    list: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 100,
    },
    empty: {
      paddingVertical: 64,
      paddingHorizontal: 32,
      alignItems: "center",
    },
    emptyIconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
      elevation: 0,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    emptyIcon: {
      fontSize: 40,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
      textAlign: "center",
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 4,
      textAlign: "center",
      lineHeight: 22,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      opacity: 0.85,
      textAlign: "center",
    },
    card: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 10,
      elevation: 0,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    coverWrap: {
      borderRadius: 14,
      margin: 12,
      overflow: "hidden",
      backgroundColor: colors.border,
    },
    cover: {
      width: 96,
      height: 140,
      backgroundColor: colors.border,
    },
    coverPlaceholder: {
      width: 96,
      height: 140,
      backgroundColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    coverPlaceholderText: {
      fontSize: 40,
    },
    cardContent: {
      flex: 1,
      paddingVertical: 14,
      paddingRight: 16,
      paddingLeft: 4,
      justifyContent: "center",
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
      letterSpacing: 0.2,
      lineHeight: 22,
    },
    cardTitleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    groupIconButton: {
      marginLeft: 8,
      marginTop: 2,
    },
    author: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 10,
      letterSpacing: 0.1,
    },
    bookListsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 2,
      marginBottom: 8,
    },
    bookListChip: {
      flexDirection: "row",
      alignItems: "center",
      maxWidth: "100%",
      backgroundColor: colors.primary + "12",
      borderWidth: 1,
      borderColor: colors.primary + "35",
      paddingLeft: 8,
      paddingRight: 4,
      paddingVertical: 4,
      borderRadius: 14,
      marginRight: 6,
      marginBottom: 4,
    },
    bookListChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
      flexShrink: 1,
      maxWidth: 140,
    },
    bookListChipRemove: {
      marginLeft: 2,
      padding: 2,
    },
    statusChip: {
      alignSelf: "flex-start",
      backgroundColor: colors.primary + "18",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      marginBottom: 10,
    },
    statusChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
      letterSpacing: 0.3,
    },
    progressWrap: {
      marginTop: 2,
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: "hidden",
      marginBottom: 6,
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    pages: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    pagesLabel: {
      fontWeight: "500",
      color: colors.textSecondary,
      opacity: 0.9,
    },
    sectionHeader: {
      marginTop: 16,
      marginBottom: 6,
      paddingHorizontal: 4,
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    fab: {
      position: "absolute",
      right: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      elevation: 6,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
    },
    sidebarOverlay: {
      flex: 1,
      flexDirection: "row",
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    sidebarBackdrop: {
      flex: 1,
    },
    sidebar: {
      width: "72%",
      maxWidth: 320,
      backgroundColor: colors.surface,
      paddingTop: 16,
      paddingHorizontal: 16,
      paddingBottom: 24,
      shadowColor: "#000",
      shadowOffset: { width: -2, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    sidebarHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    sidebarTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    sidebarSection: {
      marginBottom: 18,
    },
    sidebarSectionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.7,
    },
    sidebarChipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    sidebarGroupsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    modalContent: {
      width: "100%",
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 18,
      backgroundColor: colors.surface,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 12,
    },
    modalSectionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
    },
    modalHint: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 10,
    },
    modalGroupsList: {
      marginBottom: 16,
    },
    modalGroupItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.background,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: "transparent",
    },
    modalGroupItemActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "12",
    },
    modalGroupItemDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
    },
    modalGroupItemText: {
      fontSize: 14,
      color: colors.text,
      width: "80%",
    },
    modalGroupItemTextActive: {
      color: colors.primary,
      fontWeight: "600",
    },
    modalInputWrap: {
      marginTop: 4,
      marginBottom: 12,
    },
    modalInput: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.background,
    },
    modalButtonsRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 4,
    },
    modalButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      marginLeft: 8,
    },
    modalButtonSecondary: {
      backgroundColor: "transparent",
    },
    modalButtonSecondaryText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    modalButtonPrimary: {
      backgroundColor: colors.primary,
    },
    modalButtonPrimaryText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#fff",
    },
    modal: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      padding: 20,
    },
  });
}
