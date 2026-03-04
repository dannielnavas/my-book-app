import {
    ApiError,
    login as loginApi,
    loginGoogle,
    register as registerApi,
} from "@/lib/auth-api";
import { getMe } from "@/lib/users-api";
import type { Usuario } from "@/types/api";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

const TOKEN_KEY = "milibro_access_token";
const BIOMETRIC_ENABLED_KEY = "milibro_biometric_enabled";

interface AuthState {
  user: Usuario | null;
  token: string | null;
  isLoading: boolean;
  needsBiometric: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  enableBiometric: () => Promise<void>;
  unlockWithBiometric: () => Promise<void>;
  biometricAvailable: boolean;
  setNeedsBiometric: (v: boolean) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    needsBiometric: false,
  });
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const loadStoredToken = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const biometricEnabled =
        (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === "true";
      const hasBiometric = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasBiometric && isEnrolled);
      if (!token) {
        setState((s) => ({
          ...s,
          token: null,
          user: null,
          isLoading: false,
          needsBiometric: false,
        }));
        return;
      }
      if (biometricEnabled && hasBiometric && isEnrolled) {
        setState((s) => ({
          ...s,
          token,
          user: null,
          isLoading: false,
          needsBiometric: true,
        }));
        return;
      }
      const user = await getMe(token);
      setState((s) => ({
        ...s,
        token,
        user,
        isLoading: false,
        needsBiometric: false,
      }));
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setState((s) => ({
        ...s,
        token: null,
        user: null,
        isLoading: false,
        needsBiometric: false,
      }));
    }
  }, []);

  useEffect(() => {
    loadStoredToken();
  }, [loadStoredToken]);

  const saveTokenAndUser = useCallback(
    async (token: string, user: Usuario, enableBiometric?: boolean) => {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      if (enableBiometric) {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
      }
      setState((s) => ({ ...s, token, user, needsBiometric: false }));
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const { usuario, accessToken } = await loginApi(email, password);
      await saveTokenAndUser(accessToken, usuario);
    },
    [saveTokenAndUser],
  );

  const register = useCallback(
    async (nombre: string, email: string, password: string) => {
      const { usuario, accessToken } = await registerApi(
        nombre,
        email,
        password,
      );
      await saveTokenAndUser(accessToken, usuario);
    },
    [saveTokenAndUser],
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      const { usuario, accessToken } = await loginGoogle(idToken);
      await saveTokenAndUser(accessToken, usuario);
    },
    [saveTokenAndUser],
  );

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    setState((s) => ({ ...s, token: null, user: null, needsBiometric: false }));
  }, []);

  const enableBiometric = useCallback(async () => {
    const { success } = await LocalAuthentication.authenticateAsync({
      promptMessage:
        "Verifica tu identidad para activar el inicio con biometría",
    });
    if (!success) return;
    // En el mismo "tick" del login, `state.token` puede seguir siendo null.
    // Aseguramos que exista token persistido antes de habilitar biometría.
    const token = state.token ?? (await SecureStore.getItemAsync(TOKEN_KEY));
    if (!token) return;
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
  }, [state.token]);

  const unlockWithBiometric = useCallback(async () => {
    const { success } = await LocalAuthentication.authenticateAsync({
      promptMessage: "Desbloquea Mi Libro App",
    });
    if (!success || !state.token) return;
    const user = await getMe(state.token);
    setState((s) => ({ ...s, user, needsBiometric: false }));
  }, [state.token]);

  const setNeedsBiometric = useCallback((v: boolean) => {
    setState((s) => ({ ...s, needsBiometric: v }));
  }, []);

  const refreshUser = useCallback(async () => {
    if (!state.token) return;
    try {
      const user = await getMe(state.token);
      setState((s) => ({ ...s, user }));
    } catch {
      // ignore
    }
  }, [state.token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      loginWithGoogle,
      logout,
      enableBiometric,
      unlockWithBiometric,
      biometricAvailable,
      setNeedsBiometric,
      refreshUser,
    }),
    [
      state,
      login,
      register,
      loginWithGoogle,
      logout,
      enableBiometric,
      unlockWithBiometric,
      biometricAvailable,
      setNeedsBiometric,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError as AuthApiError };
