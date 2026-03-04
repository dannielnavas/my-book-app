import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AppColorsPalette } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { ApiError } from "@/lib/api";
import { createBook, uploadBookCover } from "@/lib/books-api";
import type { EstadoLectura, ResultadoBusqueda } from "@/types/api";

const ESTADOS: EstadoLectura[] = ["pendiente", "en_lectura", "leido"];
const ESTADO_LABEL: Record<EstadoLectura, string> = {
  pendiente: "Pendiente",
  en_lectura: "En lectura",
  leido: "Leído",
};

export default function AddBookScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { token } = useAuth();
  const params = useLocalSearchParams<{ prefill?: string; isbn?: string }>();
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [genero, setGenero] = useState("");
  const [paginasTotales, setPaginasTotales] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [estadoLectura, setEstadoLectura] =
    useState<EstadoLectura>("pendiente");
  const [loading, setLoading] = useState(false);
  const [coverLocalUri, setCoverLocalUri] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (params.prefill) {
      try {
        const p = JSON.parse(params.prefill) as ResultadoBusqueda;
        setTitulo(p.title ?? "");
        setAutor(p.author ?? "");
        setIsbn(p.isbn ?? params.isbn ?? "");
        setGenero(p.genre ?? "");
        setPaginasTotales(p.totalPages != null ? String(p.totalPages) : "");
        setDescripcion(p.description ?? "");
        setImagenUrl(p.imageUrl ?? "");
        setCoverLocalUri(null);
      } catch {
        // ignore
      }
    } else if (params.isbn) {
      setIsbn(params.isbn);
    }
  }, [params.prefill, params.isbn]);

  const handleTakeCoverPhoto = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "No disponible",
        "Tomar foto de la portada solo está disponible en dispositivos móviles.",
      );
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso requerido",
        "Necesitamos acceso a la cámara para tomar la foto de la portada.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setCoverLocalUri(asset.uri);
    // Si se toma una foto, damos prioridad a esa portada en lugar de la URL manual.
    setImagenUrl("");
  };

  const handleCreate = async () => {
    const titleTrim = titulo.trim();
    if (!titleTrim) {
      Alert.alert("Error", "El título es obligatorio");
      return;
    }
    if (!token) return;
    setLoading(true);
    try {
      const manualImageUrl = imagenUrl.trim() || undefined;
      const created = await createBook(token, {
        title: titleTrim,
        author: autor.trim() || undefined,
        isbn: isbn.trim() || undefined,
        genre: genero.trim() || undefined,
        totalPages: paginasTotales ? parseInt(paginasTotales, 10) : undefined,
        description: descripcion.trim() || undefined,
        // Si hay una foto local pendiente, la subiremos con el endpoint de portada.
        imageUrl: coverLocalUri ? undefined : manualImageUrl,
        isOwned: true,
      });
      if (coverLocalUri) {
        try {
          const res = await uploadBookCover(
            token,
            created.libroId,
            coverLocalUri,
          );
          setImagenUrl(res.imageUrl);
        } catch (e) {
          const msg =
            e instanceof ApiError
              ? e.message
              : "Libro creado pero hubo un problema al subir la portada.";
          Alert.alert("Aviso", msg);
        }
      }
      Alert.alert("Listo", "Libro añadido a tu biblioteca", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al crear el libro";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerIcon}>📚</Text>
          <Text style={styles.headerTitle}>Añadir libro</Text>
          <Text style={styles.headerSubtitle}>
            Completa los datos y añádelo a tu biblioteca
          </Text>
        </View>

        {/* Portada (preview) */}
        {(coverLocalUri || imagenUrl.trim() || titulo.trim()) && (
          <View style={styles.previewCard}>
            <View style={styles.previewCoverWrap}>
              {coverLocalUri || imagenUrl.trim() ? (
                <Image
                  source={{ uri: coverLocalUri || imagenUrl.trim() }}
                  style={styles.previewCover}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.previewCoverPlaceholder}>
                  <Text style={styles.previewCoverIcon}>📖</Text>
                </View>
              )}
            </View>
            {(titulo.trim() || autor.trim()) && (
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle} numberOfLines={2}>
                  {titulo.trim() || "Sin título"}
                </Text>
                {autor.trim() ? (
                  <Text style={styles.previewAuthor} numberOfLines={1}>
                    {autor.trim()}
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        )}

        {/* Datos principales */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos del libro</Text>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ej. Cien años de soledad"
            placeholderTextColor={colors.textSecondary}
            editable={!loading}
          />
          <Text style={styles.label}>Autor</Text>
          <TextInput
            style={styles.input}
            value={autor}
            onChangeText={setAutor}
            placeholder="Nombre del autor"
            placeholderTextColor={colors.textSecondary}
            editable={!loading}
          />
          <Text style={styles.label}>ISBN</Text>
          <TextInput
            style={styles.input}
            value={isbn}
            onChangeText={setIsbn}
            placeholder="10 o 13 dígitos"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            editable={!loading}
          />
          <Text style={styles.label}>Género</Text>
          <TextInput
            style={styles.input}
            value={genero}
            onChangeText={setGenero}
            placeholder="Ej. Novela, Ensayo..."
            placeholderTextColor={colors.textSecondary}
            editable={!loading}
          />
        </View>

        {/* Lectura */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lectura</Text>
          <Text style={styles.label}>Páginas totales</Text>
          <TextInput
            style={styles.input}
            value={paginasTotales}
            onChangeText={setPaginasTotales}
            placeholder="Ej. 350"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            editable={!loading}
          />
          {/* <Text style={styles.label}>Estado</Text>
          <View style={styles.estadoRow}>
            {ESTADOS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[
                  styles.estadoChip,
                  estadoLectura === e && styles.estadoChipActive,
                ]}
                onPress={() => setEstadoLectura(e)}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.estadoChipText,
                    estadoLectura === e && styles.estadoChipTextActive,
                  ]}
                >
                  {ESTADO_LABEL[e]}
                </Text>
              </TouchableOpacity>
            ))}
          </View> */}
        </View>

        {/* Descripción y portada */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Más información</Text>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Resumen o sinopsis (opcional)"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            editable={!loading}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Text style={styles.label}>Portada</Text>
            <TouchableOpacity
              onPress={handleTakeCoverPhoto}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                Tomar foto
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>URL de la portada (opcional)</Text>
          <TextInput
            style={styles.input}
            value={imagenUrl}
            onChangeText={setImagenUrl}
            placeholder="https://..."
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Añadir a mi biblioteca</Text>
              <Text style={styles.buttonSubtext}>
                Aparecerá en tu pestaña Biblioteca
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: AppColorsPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      paddingHorizontal: 20,
      paddingBottom: 48,
    },
    header: {
      alignItems: "center",
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    headerIcon: {
      fontSize: 44,
      marginBottom: 8,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
      letterSpacing: 0.2,
    },
    headerSubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      width: "100%",
    },
    previewCard: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 14,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      alignItems: "center",
    },
    previewCoverWrap: {
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: colors.border,
    },
    previewCover: {
      width: 64,
      height: 96,
      backgroundColor: colors.border,
    },
    previewCoverPlaceholder: {
      width: 64,
      height: 96,
      backgroundColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    previewCoverIcon: {
      fontSize: 28,
    },
    previewInfo: {
      flex: 1,
      marginLeft: 14,
      justifyContent: "center",
    },
    previewTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    previewAuthor: {
      fontSize: 14,
      color: colors.textSecondary,
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
    cardTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
      letterSpacing: 0.2,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 6,
      marginTop: 4,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
      marginBottom: 12,
    },
    textArea: {
      minHeight: 88,
      textAlignVertical: "top",
      paddingTop: 14,
    },
    estadoRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 4,
    },
    estadoChip: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    estadoChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    estadoChipText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "500",
    },
    estadoChipTextActive: {
      color: "#fff",
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 18,
      paddingVertical: 18,
      paddingHorizontal: 24,
      alignItems: "center",
      marginTop: 12,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
      width: "100%",
    },
    buttonSubtext: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 13,
      marginTop: 4,
      textAlign: "center",
      width: "100%",
    },
  });
}
