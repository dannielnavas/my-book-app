import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
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

import type { AppColorsPalette } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { ApiError } from "@/lib/api";
import { getBook, updateBook, uploadBookCover } from "@/lib/books-api";
import type { EstadoLectura, Libro } from "@/types/api";

const ESTADOS: EstadoLectura[] = ["pendiente", "en_lectura", "leido"];

export default function EditBookScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const libroId = id ? parseInt(id, 10) : NaN;
  const [book, setBook] = useState<Libro | null>(null);
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [genero, setGenero] = useState("");
  const [paginasTotales, setPaginasTotales] = useState("");
  const [paginasLeidas, setPaginasLeidas] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [estadoLectura, setEstadoLectura] =
    useState<EstadoLectura>("pendiente");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverLocalUri, setCoverLocalUri] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const load = useCallback(async () => {
    if (!token || isNaN(libroId)) return;
    try {
      const b = await getBook(token, libroId);
      setBook(b);
      setTitulo(b.titulo);
      setAutor(b.autor ?? "");
      setIsbn(b.isbn ?? "");
      setGenero(b.genero ?? "");
      setPaginasTotales(
        b.paginasTotales != null ? String(b.paginasTotales) : "",
      );
      setPaginasLeidas(b.paginasLeidas != null ? String(b.paginasLeidas) : "");
      setDescripcion(b.descripcion ?? "");
      setImagenUrl(b.imagenUrl ?? "");
      setEstadoLectura(b.estadoLectura);
      setCoverLocalUri(null);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al cargar";
      Alert.alert("Error", msg, [{ text: "OK", onPress: () => router.back() }]);
    } finally {
      setLoading(false);
    }
  }, [token, libroId, router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTakeCoverPhoto = async () => {
    if (!token || !book) return;

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
    setUploadingCover(true);
    try {
      const res = await uploadBookCover(token, book.libroId, asset.uri);
      setImagenUrl(res.imageUrl);
      if (res.book) setBook(res.book);
      Alert.alert("Portada actualizada", "La nueva portada se ha guardado.");
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Error al subir la portada";
      Alert.alert("Error", msg);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    const titleTrim = titulo.trim();
    if (!titleTrim) {
      Alert.alert("Error", "El título es obligatorio");
      return;
    }
    if (!token || !book) return;
    setSaving(true);
    try {
      await updateBook(token, book.libroId, {
        title: titleTrim,
        author: autor.trim() || undefined,
        isbn: isbn.trim() || undefined,
        genre: genero.trim() || undefined,
        totalPages: paginasTotales ? parseInt(paginasTotales, 10) : undefined,
        pagesRead: paginasLeidas ? parseInt(paginasLeidas, 10) : undefined,
        description: descripcion.trim() || undefined,
        imageUrl: imagenUrl.trim() || undefined,
        readingStatus: estadoLectura,
      });
      Alert.alert("Guardado", "Cambios guardados", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al guardar";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !book) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {(coverLocalUri || imagenUrl.trim()) && (
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <Image
              source={{ uri: coverLocalUri || imagenUrl.trim() }}
              style={{
                width: 96,
                height: 144,
                borderRadius: 10,
                backgroundColor: colors.border,
              }}
              resizeMode="cover"
            />
          </View>
        )}
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Título"
          placeholderTextColor={colors.textSecondary}
          editable={!saving}
        />
        <Text style={styles.label}>Autor</Text>
        <TextInput
          style={styles.input}
          value={autor}
          onChangeText={setAutor}
          placeholder="Autor"
          placeholderTextColor={colors.textSecondary}
          editable={!saving}
        />
        <Text style={styles.label}>ISBN</Text>
        <TextInput
          style={styles.input}
          value={isbn}
          onChangeText={setIsbn}
          placeholder="ISBN"
          placeholderTextColor={colors.textSecondary}
          editable={!saving}
        />
        <Text style={styles.label}>Género</Text>
        <TextInput
          style={styles.input}
          value={genero}
          onChangeText={setGenero}
          placeholder="Género"
          placeholderTextColor={colors.textSecondary}
          editable={!saving}
        />
        <Text style={styles.label}>Páginas totales</Text>
        <TextInput
          style={styles.input}
          value={paginasTotales}
          onChangeText={setPaginasTotales}
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          editable={!saving}
        />
        <Text style={styles.label}>Páginas leídas</Text>
        <TextInput
          style={styles.input}
          value={paginasLeidas}
          onChangeText={setPaginasLeidas}
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          editable={!saving}
        />
        <Text style={styles.label}>Estado de lectura</Text>
        <View style={styles.estadoRow}>
          {ESTADOS.map((e) => (
            <TouchableOpacity
              key={e}
              style={[
                styles.estadoChip,
                estadoLectura === e && styles.estadoChipActive,
              ]}
              onPress={() => setEstadoLectura(e)}
              disabled={saving}
            >
              <Text
                style={[
                  styles.estadoChipText,
                  estadoLectura === e && styles.estadoChipTextActive,
                ]}
              >
                {e === "pendiente"
                  ? "Pendiente"
                  : e === "en_lectura"
                    ? "En lectura"
                    : "Leído"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Descripción"
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
          editable={!saving}
        />
        <View style={styles.portadaHeaderRow}>
          <Text style={styles.label}>Portada</Text>
          <TouchableOpacity
            onPress={handleTakeCoverPhoto}
            disabled={saving || uploadingCover}
            activeOpacity={0.8}
          >
            <Text
              style={{
                color: colors.primary,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              {uploadingCover ? "Subiendo..." : "Tomar foto"}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>URL de portada (opcional)</Text>
        <TextInput
          style={styles.input}
          value={imagenUrl}
          onChangeText={setImagenUrl}
          placeholder="https://..."
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          editable={!saving}
        />
        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Guardar cambios</Text>
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
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    scroll: {
      padding: 24,
      paddingBottom: 48,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
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
      marginBottom: 16,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    estadoRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    estadoChip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    estadoChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    estadoChipText: {
      fontSize: 14,
      color: colors.text,
    },
    estadoChipTextActive: {
      color: "#fff",
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "600",
    },
    portadaHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
    },
  });
}
