import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { AppColorsPalette } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { ApiError } from "@/lib/api";
import { searchBooks } from "@/lib/books-api";
import type { ResultadoBusqueda } from "@/types/api";

export default function SearchScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultadoBusqueda[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q || !token) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const list = await searchBooks(token, { q, limit: 10 });
      setResults(list);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al buscar";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }, [query, token]);

  const onSelect = (item: ResultadoBusqueda) => {
    router.replace({
      pathname: "/add-book",
      params: { prefill: JSON.stringify(item) },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TextInput
          style={styles.input}
          placeholder="Título o autor..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
          autoFocus
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={search}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Buscar</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item, i) => item.externalId ?? `${i}-${item.title}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading && query.trim() ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Sin resultados</Text>
              <TouchableOpacity
                style={styles.link}
                onPress={() =>
                  router.replace({ pathname: "/add-book", params: {} })
                }
              >
                <Text style={styles.linkText}>Añadir manualmente</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.cover} />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Text style={styles.coverPlaceholderText}>📖</Text>
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              {item.author ? (
                <Text style={styles.author} numberOfLines={1}>
                  {item.author}
                </Text>
              ) : null}
              {item.isbn ? (
                <Text style={styles.isbn}>ISBN: {item.isbn}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: AppColorsPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      padding: 16,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    input: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    searchButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 20,
      justifyContent: "center",
      minWidth: 80,
    },
    searchButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    list: {
      padding: 16,
      paddingBottom: 32,
    },
    empty: {
      paddingVertical: 48,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 16,
      textAlign: "center",
      width: "100%",
    },
    link: {
      padding: 12,
      width: "100%",
    },
    linkText: {
      color: colors.primary,
      fontSize: 15,
      textAlign: "center",
      width: "100%",
    },
    card: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    cover: {
      width: 70,
      height: 100,
      backgroundColor: colors.border,
    },
    coverPlaceholder: {
      width: 70,
      height: 100,
      backgroundColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    coverPlaceholderText: {
      fontSize: 28,
    },
    cardContent: {
      flex: 1,
      padding: 12,
      justifyContent: "center",
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    author: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    isbn: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
}
