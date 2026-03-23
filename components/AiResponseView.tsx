import { useMemo } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import type { AppColorsPalette } from "@/constants/colors";
import { useAppColors } from "@/hooks/use-app-colors";

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function pickArray(obj: Record<string, unknown>, keys: string[]): unknown[] {
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

function formatListItem(item: unknown): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object" && !Array.isArray(item)) {
    const o = item as Record<string, unknown>;
    const title = pickString(o, ["title", "titulo", "nombre", "name"]);
    const author = pickString(o, ["author", "autor"]);
    if (title && author) return `${title} — ${author}`;
    if (title) return title;
  }
  try {
    return JSON.stringify(item);
  } catch {
    return String(item);
  }
}

/**
 * Muestra respuestas IA de forma legible; si la forma no coincide, cae a JSON formateado.
 */
export function AiResponseView({ data }: { data: unknown }) {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (data == null) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>Sin contenido en la respuesta.</Text>
      </View>
    );
  }

  if (typeof data === "string") {
    return (
      <View style={styles.card}>
        <Text style={styles.body}>{data}</Text>
      </View>
    );
  }

  if (typeof data !== "object" || Array.isArray(data)) {
    return (
      <ScrollView
        horizontal
        style={styles.rawScroll}
        showsHorizontalScrollIndicator={false}
      >
        <Text style={styles.raw} selectable>
          {JSON.stringify(data, null, 2)}
        </Text>
      </ScrollView>
    );
  }

  const obj = data as Record<string, unknown>;
  const sections: { label: string; content: string }[] = [];

  const answer = pickString(obj, ["answer", "respuesta", "respuestaTexto"]);
  if (answer) sections.push({ label: "Respuesta", content: answer });

  const summary = pickString(obj, ["summary", "resumen", "sinopsis"]);
  if (summary) sections.push({ label: "Resumen", content: summary });

  const themes = pickArray(obj, ["themes", "temas", "topics", "topicos"]);
  if (themes.length) {
    sections.push({
      label: "Temas",
      content: themes.map((t) => `• ${formatListItem(t)}`).join("\n"),
    });
  }

  const books = pickArray(obj, [
    "books",
    "libros",
    "recommendations",
    "recomendaciones",
    "similar",
    "similares",
    "sugerencias",
  ]);
  if (books.length) {
    sections.push({
      label: "Sugerencias",
      content: books.map((b, i) => `${i + 1}. ${formatListItem(b)}`).join("\n"),
    });
  }

  const plan = pickArray(obj, ["plan", "pasos", "steps", "semanas", "weeks"]);
  if (plan.length) {
    sections.push({
      label: "Plan",
      content: plan.map((p, i) => `${i + 1}. ${formatListItem(p)}`).join("\n"),
    });
  }

  if (sections.length === 0) {
    const nested =
      obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)
        ? (obj.data as Record<string, unknown>)
        : null;
    if (nested) {
      return <AiResponseView data={nested} />;
    }
    return (
      <ScrollView
        horizontal
        style={styles.rawScroll}
        showsHorizontalScrollIndicator={false}
      >
        <Text style={styles.raw} selectable>
          {JSON.stringify(obj, null, 2)}
        </Text>
      </ScrollView>
    );
  }

  return (
    <View style={styles.stack}>
      {sections.map((s) => (
        <View key={s.label} style={styles.card}>
          <Text style={styles.sectionLabel}>{s.label}</Text>
          <Text style={styles.body} selectable>
            {s.content}
          </Text>
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: AppColorsPalette) {
  return StyleSheet.create({
    stack: { gap: 12 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 8,
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.text,
    },
    emptyBox: {
      padding: 20,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    rawScroll: { maxHeight: 360 },
    raw: {
      fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
      fontSize: 12,
      lineHeight: 18,
      color: colors.textSecondary,
      paddingVertical: 4,
    },
  });
}
