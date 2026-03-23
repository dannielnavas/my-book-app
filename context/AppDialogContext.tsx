import { Ionicons } from "@expo/vector-icons";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AppColorsPalette } from "@/constants/colors";
import { useAppColors } from "@/hooks/use-app-colors";

export type AppDialogButtonStyle = "default" | "cancel" | "destructive";

export type AppDialogButton = {
  text: string;
  onPress?: () => void;
  style?: AppDialogButtonStyle;
};

export type AppDialogTone =
  | "neutral"
  | "error"
  | "success"
  | "warning"
  | "info";

type DialogState = {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AppDialogButton[];
  tone: AppDialogTone;
};

const DEFAULT_BTN: AppDialogButton = { text: "Entendido", style: "default" };

type AppDialogContextValue = {
  alert: (
    title: string,
    message?: string,
    buttons?: AppDialogButton[],
    options?: { tone?: AppDialogTone },
  ) => void;
};

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

function inferToneFromTitle(title: string): AppDialogTone {
  const t = title.toLowerCase();
  if (
    t === "error" ||
    t.includes("error") ||
    t.includes("algo salió") ||
    t.includes("no pudimos")
  ) {
    return "error";
  }
  if (
    t.includes("guardado") ||
    t.includes("listo") ||
    t.includes("actualiz") ||
    t.includes("registrad")
  ) {
    return "success";
  }
  return "neutral";
}

function toneIcon(
  tone: AppDialogTone,
): React.ComponentProps<typeof Ionicons>["name"] {
  switch (tone) {
    case "error":
      return "alert-circle";
    case "success":
      return "checkmark-circle";
    case "warning":
      return "warning";
    case "info":
      return "information-circle";
    default:
      return "book";
  }
}

function toneAccent(tone: AppDialogTone, colors: AppColorsPalette): string {
  switch (tone) {
    case "error":
      return colors.error;
    case "success":
      return colors.success;
    case "warning":
      return colors.warning;
    case "info":
      return colors.primary;
    default:
      return colors.primary;
  }
}

function createDialogStyles(colors: AppColorsPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(15, 17, 23, 0.55)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    card: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingTop: 22,
      paddingHorizontal: 20,
      paddingBottom: 18,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 12,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
      alignSelf: "center",
    },
    title: {
      fontSize: 19,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
      lineHeight: 26,
    },
    message: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 20,
    },
    row: {
      flexDirection: "row",
      gap: 10,
    },
    col: {
      gap: 10,
    },
    btnBase: {
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
    },
    btnFlex: {
      flex: 1,
    },
    btnPrimary: {
      backgroundColor: colors.primary,
    },
    btnPrimaryText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    btnSecondary: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    btnSecondaryText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    btnDestructive: {
      backgroundColor: colors.error + "18",
      borderWidth: 1,
      borderColor: colors.error + "55",
    },
    btnDestructiveText: {
      color: colors.error,
      fontSize: 16,
      fontWeight: "600",
    },
  });
}

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<DialogState>({
    visible: false,
    title: "",
    message: undefined,
    buttons: [DEFAULT_BTN],
    tone: "neutral",
  });

  const styles = useMemo(() => createDialogStyles(colors), [colors]);

  const hide = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  const alert = useCallback(
    (
      title: string,
      message?: string,
      buttons?: AppDialogButton[],
      options?: { tone?: AppDialogTone },
    ) => {
      const resolved =
        buttons && buttons.length > 0 ? buttons : [DEFAULT_BTN];
      setState({
        visible: true,
        title,
        message,
        buttons: resolved,
        tone: options?.tone ?? inferToneFromTitle(title),
      });
    },
    [],
  );

  const runAfterClose = useCallback((fn?: () => void) => {
    if (!fn) return;
    setTimeout(fn, 320);
  }, []);

  const onButtonPress = useCallback(
    (btn: AppDialogButton) => {
      hide();
      runAfterClose(btn.onPress);
    },
    [hide, runAfterClose],
  );

  const accent = toneAccent(state.tone, colors);
  const iconName = toneIcon(state.tone);
  const multi = state.buttons.length > 2;

  return (
    <AppDialogContext.Provider value={{ alert }}>
      {children}
      <Modal
        visible={state.visible}
        transparent
        animationType="fade"
        onRequestClose={hide}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View
            style={[styles.card, { marginBottom: Math.max(insets.bottom, 8) }]}
            accessibilityViewIsModal
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: accent + "22" },
              ]}
            >
              <Ionicons name={iconName} size={28} color={accent} />
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {state.title}
            </Text>
            {state.message ? (
              <Text style={styles.message}>{state.message}</Text>
            ) : null}
            {multi ? (
              <View style={styles.col}>
                {state.buttons.map((btn, i) => {
                  const effective =
                    btn.style ??
                    (i === 0 ? ("default" as const) : ("cancel" as const));
                  return (
                    <TouchableOpacity
                      key={`${btn.text}-${i}`}
                      style={[
                        styles.btnBase,
                        effective === "destructive" && styles.btnDestructive,
                        effective === "cancel" && styles.btnSecondary,
                        effective === "default" && styles.btnPrimary,
                      ]}
                      onPress={() => onButtonPress(btn)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={
                          effective === "destructive"
                            ? styles.btnDestructiveText
                            : effective === "cancel"
                              ? styles.btnSecondaryText
                              : styles.btnPrimaryText
                        }
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : state.buttons.length === 2 ? (
              <View style={styles.row}>
                {state.buttons.map((btn, i) => (
                  <TouchableOpacity
                    key={`${btn.text}-${i}`}
                    style={[
                      styles.btnBase,
                      styles.btnFlex,
                      btn.style === "destructive" && styles.btnDestructive,
                      btn.style === "cancel" && styles.btnSecondary,
                      (btn.style === "default" || !btn.style) &&
                        styles.btnPrimary,
                    ]}
                    onPress={() => onButtonPress(btn)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={
                        btn.style === "destructive"
                          ? styles.btnDestructiveText
                          : btn.style === "cancel"
                            ? styles.btnSecondaryText
                            : styles.btnPrimaryText
                      }
                      numberOfLines={2}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              (() => {
                const btn = state.buttons[0] ?? DEFAULT_BTN;
                return (
                  <TouchableOpacity
                    style={[
                      styles.btnBase,
                      btn.style === "destructive" && styles.btnDestructive,
                      btn.style === "cancel" && styles.btnSecondary,
                      (btn.style === "default" || !btn.style) &&
                        styles.btnPrimary,
                    ]}
                    onPress={() => onButtonPress(btn)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={
                        btn.style === "destructive"
                          ? styles.btnDestructiveText
                          : btn.style === "cancel"
                            ? styles.btnSecondaryText
                            : styles.btnPrimaryText
                      }
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })()
            )}
          </View>
        </View>
      </Modal>
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error("useAppDialog debe usarse dentro de AppDialogProvider");
  }
  return ctx;
}
