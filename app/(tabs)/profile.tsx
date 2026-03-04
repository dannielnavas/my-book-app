import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AppColorsPalette } from "@/constants/colors";
import { getLevelProgress } from "@/constants/gamification";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/use-app-colors";
import { getMe } from "@/lib/users-api";
import type { Usuario } from "@/types/api";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user: authUser, token, logout } = useAuth();
  const [user, setUser] = useState<Usuario | null>(authUser ?? null);
  const [loading, setLoading] = useState(!!token && !authUser);

  const loadUser = useCallback(async () => {
    if (!token) return;
    try {
      const me = await getMe(token);
      setUser(me);
    } catch {
      setUser(authUser ?? null);
    } finally {
      setLoading(false);
    }
  }, [token, authUser]);

  useEffect(() => {
    if (authUser) setUser(authUser);
    else if (token) loadUser();
  }, [authUser, token, loadUser]);

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleEditProfile = () => router.push("/profile-edit");
  const handleRecommendations = () => router.push("/recommendations");
  const handleScan = () => router.push("/scan");

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = Math.min(width - 32, 400);
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const xp = user?.xpPoints ?? 0;
  const level = user?.level ?? 1;
  const streak = user?.readingStreakDays ?? 0;
  const levelProgress = getLevelProgress(xp);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const displayName = user?.name ?? "Usuario";
  const handleStr = user?.email ? `@${user.email.split("@")[0]}` : "@usuario";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: 24 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header: avatar + nombre + acciones */}
      <View style={[styles.header, { width: contentWidth }]}>
        <View style={styles.headerUser}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.headerDatos}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.primary}
              />
            </View>
            <Text style={styles.handle} numberOfLines={1}>
              {handleStr}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={handleScan}
            activeOpacity={0.8}
          >
            <Ionicons
              name="scan-outline"
              size={22}
              color={colors.textSecondary}
            />
            <Text style={styles.btnSecondaryLabel}>Escanear libro</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleRecommendations}
            activeOpacity={0.8}
          >
            <Ionicons
              name="sparkles-outline"
              size={22}
              color={colors.surface}
            />
            <Text style={styles.btnPrimaryLabel}>Recomendaciones IA</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bloque gamificación 2026: Experiencia, Nivel, Racha */}
      <View style={[styles.gamificationBlock, { width: contentWidth }]}>
        <View style={styles.gamificationInner}>
          <View style={styles.gamificationStats}>
            <View style={styles.gamificationStat}>
              <View style={styles.gamificationIconWrap}>
                <Ionicons name="flash" size={26} color={colors.primary} />
              </View>
              <Text style={styles.gamificationValue}>{xp}</Text>
              <Text style={styles.gamificationLabel}>Experiencia</Text>
            </View>
            <View style={styles.gamificationStat}>
              <View
                style={[
                  styles.gamificationIconWrap,
                  styles.gamificationIconHighlight,
                ]}
              >
                <Ionicons name="trophy" size={26} color={colors.surface} />
              </View>
              <Text style={styles.gamificationValue}>{level}</Text>
              <Text style={styles.gamificationLabel}>Nivel</Text>
            </View>
            <View style={styles.gamificationStat}>
              <View style={styles.gamificationIconWrap}>
                <Ionicons name="flame" size={26} color={colors.warning} />
              </View>
              <Text style={styles.gamificationValue}>{streak}</Text>
              <Text style={styles.gamificationLabel}>Racha (días)</Text>
            </View>
          </View>
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${levelProgress * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(levelProgress * 100)}% al siguiente nivel
            </Text>
          </View>
        </View>
      </View>

      {/* Card: Datos de cuenta */}
      <View style={[styles.card, { width: contentWidth }]}>
        <RowItem
          icon="person-outline"
          label="Nombre"
          value={displayName}
          onPress={handleEditProfile}
          showArrow
        />
        <RowItem icon="mail-outline" label="Correo" value={user?.email ?? ""} />
        <RowItem
          icon="key-outline"
          label="Contraseña"
          value="••••••••"
          onPress={handleEditProfile}
          showArrow
        />
      </View>

      {/* Card: Información de la app */}
      <View style={[styles.card, { width: contentWidth }]}>
        <RowItem
          icon="information-circle-outline"
          label="Versión"
          value={appVersion}
        />
        <RowItem
          icon="help-circle-outline"
          label="Ayuda"
          value="Soporte"
          onPress={() => {}}
          showArrow
        />
        <RowItem
          icon="shield-checkmark-outline"
          label="Política de privacidad"
          value="Consulta"
          onPress={() => {}}
          showArrow
        />
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity
        style={[styles.logoutWrap, { width: contentWidth }]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>Cerrar sesión</Text>
        <Ionicons name="log-out-outline" size={22} color={colors.error} />
      </TouchableOpacity>
    </ScrollView>
  );
}

function RowItem({
  icon,
  label,
  value,
  onPress,
  showArrow,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
  showArrow?: boolean;
}) {
  const colors = useAppColors();
  const content = (
    <View style={rowItemStyles.row}>
      <Ionicons name={icon} size={22} color={colors.textSecondary} />
      <View style={rowItemStyles.textWrap}>
        <Text style={[rowItemStyles.label, { color: colors.text }]}>
          {label}
        </Text>
        <Text
          style={[rowItemStyles.value, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      {showArrow && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      )}
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={rowItemStyles.touchable}
      >
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={rowItemStyles.touchable}>{content}</View>;
}

const rowItemStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  textWrap: { flex: 1, minWidth: 0 },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
  },
  touchable: {
    width: "100%",
  },
});

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
    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
      alignItems: "center",
      width: "100%",
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 16,
      marginBottom: 16,
    },
    headerUser: {
      alignItems: "center",
      width: 100,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: "800",
      color: colors.surface,
    },
    headerDatos: {
      width: "100%",
      alignItems: "center",
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 2,
    },
    name: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      maxWidth: 90,
    },
    handle: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    headerActions: {
      flex: 1,
      gap: 12,
      minWidth: 0,
    },
    btnSecondary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    btnSecondaryLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    btnPrimary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.primary,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
    btnPrimaryLabel: {
      fontSize: 14,
      color: colors.surface,
      fontWeight: "600",
    },
    gamificationBlock: {
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
    gamificationInner: {
      padding: 20,
      paddingVertical: 24,
    },
    gamificationStats: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "flex-start",
      marginBottom: 20,
    },
    gamificationStat: {
      alignItems: "center",
      flex: 1,
    },
    gamificationIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    gamificationIconHighlight: {
      backgroundColor: colors.primary,
    },
    gamificationValue: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.surface,
      letterSpacing: -0.5,
    },
    gamificationLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: "rgba(255,255,255,0.85)",
      marginTop: 4,
      textAlign: "center",
    },
    progressWrap: {
      paddingHorizontal: 4,
    },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: "rgba(255,255,255,0.25)",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    progressText: {
      fontSize: 11,
      color: "rgba(255,255,255,0.8)",
      marginTop: 8,
      textAlign: "center",
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 8,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    logoutWrap: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    logoutText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.error,
    },
  });
}
