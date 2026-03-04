import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";

import type { AppColorsPalette } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { ApiError } from "@/lib/api";
import { searchBooks } from "@/lib/books-api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const FRAME_WIDTH = Math.min(SCREEN_WIDTH - 48, 280);
const FRAME_HEIGHT = 140;

function normalizeIsbn(data: string): string {
  const digits = data.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 13) return digits;
  return data;
}

function isValidIsbn(digits: string): boolean {
  return digits.length === 10 || digits.length === 13;
}

export default function ScanScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const onBarcodeScanned = useCallback(
    async ({ data, type }: { data: string; type: string }) => {
      if (scanned || !token) return;
      const isbn = normalizeIsbn(data);
      if (!isValidIsbn(isbn)) {
        Alert.alert(
          'Código no válido',
          'El código escaneado no parece un ISBN (10 o 13 dígitos). ¿Buscar por texto o añadir manualmente?',
          [
            { text: 'Buscar por nombre', onPress: () => router.replace('/search') },
            { text: 'Añadir manualmente', onPress: () => router.replace({ pathname: '/add-book', params: {} }) },
            { text: 'Reintentar', onPress: () => setScanned(false) },
          ]
        );
        return;
      }
      setScanned(true);
      try {
        const results = await searchBooks(token, { isbn });
        if (results.length > 0) {
          router.replace({
            pathname: '/add-book',
            params: { prefill: JSON.stringify(results[0]) },
          });
        } else {
          Alert.alert(
            'Sin resultados por ISBN',
            'No encontramos libros con ese ISBN. ¿Buscar por nombre o añadir manualmente?',
            [
              { text: 'Buscar por nombre', onPress: () => router.replace('/search') },
              {
                text: 'Añadir manualmente',
                onPress: () =>
                  router.replace({
                    pathname: '/add-book',
                    params: { isbn },
                  }),
              },
            ]
          );
        }
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : 'Error al buscar';
        Alert.alert('Error', msg, [{ text: 'OK', onPress: () => setScanned(false) }]);
      }
    },
    [scanned, token, router]
  );

  if (!permission) {
    return (
      <View style={[styles.centered, styles.centeredBg]}>
        <Text style={styles.message}>Solicitando permiso de cámara...</Text>
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, styles.permissionScreen]} edges={["top", "bottom"]}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Cámara para escanear</Text>
          <Text style={styles.permissionText}>
            Necesitamos acceso a la cámara para leer el código de barras ISBN de
            tus libros.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.9}
          >
            <Text style={styles.permissionButtonText}>Conceder permiso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.permissionLink} onPress={() => router.back()}>
            <Text style={styles.permissionLinkText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "code128"],
        }}
        onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
      />

      {/* Overlay oscuro con ventana central (viewfinder) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      <SafeAreaView style={styles.headerBar} edges={["top"]}>
        <Text style={styles.headerTitle}>Escanear ISBN</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.closeText}>Cerrar</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.footer} pointerEvents="box-none">
        <View style={styles.footerCard}>
          <Text style={styles.footerIcon}>{scanned ? "⏳" : "📖"}</Text>
          {scanned ? (
            <View>
              <Text style={styles.footerTitle}>Buscando libro...</Text>
              <Text style={styles.footerSubtitle}>
                Obteniendo datos del ISBN
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.footerTitle}>
                Apunta al código de barras
              </Text>
              <Text style={styles.footerSubtitle}>
                Coloca el código dentro del recuadro para escanear
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const OVERLAY_COLOR = "rgba(0,0,0,0.55)";
const CORNER_COLOR = "#fff";
const CORNER_SIZE = 28;
const CORNER_BORDER = 4;

function createStyles(colors: AppColorsPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000",
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    centeredBg: {
      backgroundColor: colors.background,
    },
    // Permission screen
    permissionScreen: {
      backgroundColor: colors.background,
      justifyContent: "center",
      padding: 24,
    },
    permissionCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 28,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    permissionIcon: {
      fontSize: 56,
      marginBottom: 16,
    },
    permissionTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 10,
      textAlign: "center",
    },
    permissionText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 24,
    },
    permissionButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 28,
      borderRadius: 16,
      marginBottom: 14,
    },
    permissionButtonText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "600",
    },
    permissionLink: {
      padding: 10,
    },
    permissionLinkText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "500",
    },
    // Overlay con ventana de escaneo
    overlayTop: {
      flex: 1,
      backgroundColor: OVERLAY_COLOR,
    },
    overlayMiddle: {
      flexDirection: "row",
      height: FRAME_HEIGHT,
    },
    overlaySide: {
      flex: 1,
      backgroundColor: OVERLAY_COLOR,
    },
    viewfinder: {
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
      backgroundColor: "transparent",
      position: "relative",
    },
    corner: {
      position: "absolute",
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      borderColor: CORNER_COLOR,
      borderWidth: CORNER_BORDER,
    },
    cornerTL: {
      top: 0,
      left: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderTopLeftRadius: 12,
    },
    cornerTR: {
      top: 0,
      right: 0,
      borderLeftWidth: 0,
      borderBottomWidth: 0,
      borderTopRightRadius: 12,
    },
    cornerBL: {
      bottom: 0,
      left: 0,
      borderRightWidth: 0,
      borderTopWidth: 0,
      borderBottomLeftRadius: 12,
    },
    cornerBR: {
      bottom: 0,
      right: 0,
      borderLeftWidth: 0,
      borderTopWidth: 0,
      borderBottomRightRadius: 12,
    },
    overlayBottom: {
      flex: 1,
      backgroundColor: OVERLAY_COLOR,
    },
    // Barra superior
    headerBar: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#fff",
      letterSpacing: 0.2,
    },
    closeButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: "rgba(0,0,0,0.4)",
      borderRadius: 14,
    },
    closeText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
    },
    // Pie con instrucciones
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 20,
      paddingBottom: 34,
      alignItems: "center",
    },
    footerCard: {
      backgroundColor: "rgba(0,0,0,0.75)",
      borderRadius: 20,
      paddingVertical: 20,
      paddingHorizontal: 24,
      alignItems: "center",
      minWidth: "100%",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.1)",
    },
    footerIcon: {
      fontSize: 32,
      marginBottom: 10,
    },
    footerTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: "#fff",
      marginBottom: 4,
      textAlign: "center",
    },
    footerSubtitle: {
      fontSize: 14,
      color: "rgba(255,255,255,0.85)",
      textAlign: "center",
      lineHeight: 20,
    },
    message: {
      color: colors.text,
      textAlign: "center",
      marginBottom: 24,
      fontSize: 16,
    },
  });
}
