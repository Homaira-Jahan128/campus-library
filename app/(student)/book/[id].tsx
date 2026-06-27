import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ScreenHeader } from "@/components/ScreenHeader";
import { COLORS, FONT, RADIUS, SPACING } from "@/utils/constants";
import { BookItem } from "@/types";
import { getBookById, getCopiesByTitle } from "@/services/bookService";
import { submitLoanRequest } from "@/services/requestService";
import { createNotification } from "@/services/notificationService";
import { useAuth } from "@/context/AuthContext";

const PRESET_DURATIONS = [7, 14, 21, 30];

export default function BookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { appUser } = useAuth();
  const [book, setBook] = useState<BookItem | null>(null);
  const [copies, setCopies] = useState<BookItem[]>([]);
  const [selected, setSelected] = useState<BookItem | null>(null);

  // Duration — preset chip or custom input
  const [durationMode, setDurationMode] = useState<"preset" | "custom">("preset");
  const [presetDuration, setPresetDuration] = useState(7);
  const [customDuration, setCustomDuration] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(student)/search");
  };

  useEffect(() => {
    (async () => {
      const b = await getBookById(id);
      setBook(b);
      if (b) {
        const all = await getCopiesByTitle(b.title);
        setCopies(all);
        setSelected(all.find((c) => c.id === b.id) ?? all[0] ?? b);
      }
      setLoading(false);
    })();
  }, [id]);

  const getEffectiveDuration = (): number | null => {
    if (durationMode === "preset") return presetDuration;
    const val = parseInt(customDuration, 10);
    if (isNaN(val) || val < 1 || val > 90) return null;
    return val;
  };

  const handleBorrow = async () => {
    if (!appUser || !selected) return;
    if (selected.availableCopies <= 0) {
      Alert.alert("Unavailable", "No copies available in this library.");
      return;
    }
    const duration = getEffectiveDuration();
    if (!duration) {
      Alert.alert("Invalid Duration", "Please enter a valid number of days (1–90).");
      return;
    }

    setSubmitting(true);
    try {
      await submitLoanRequest({
        bookId: selected.id,
        bookTitle: selected.title,
        userId: appUser.uid,
        userName: appUser.name,
        userRoll: appUser.rollNumber,        // যোগ করো
        userDepartment: appUser.department,  // যোগ করো
        libraryId: selected.libraryId,
        libraryName: selected.libraryName,
        loanDurationDays: duration,
      });
      await createNotification(
        appUser.uid,
        "Request Submitted",
        `Your request for "${selected.title}" (${duration} days) has been sent to ${selected.libraryName}.`,
        "request_submitted"
      );
      Alert.alert("Request Sent ✓", `Borrow request submitted for ${duration} days.`, [
        { text: "OK", onPress: goBack },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );

  if (!book)
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Book not found.</Text>
      </View>
    );

  const effectiveDuration = getEffectiveDuration();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScreenHeader
        title={book.type === "book" ? "Book Details" : "Paper Details"}
        subtitle={book.libraryName}
        showBack
        onBackPress={goBack}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type badge */}
        <View style={[styles.typeBadge, book.type === "paper" && styles.typeBadgePaper]}>
          <Ionicons
            name={book.type === "book" ? "book" : "document-text"}
            size={12}
            color={book.type === "book" ? COLORS.primary : "#6C63FF"}
          />
          <Text style={[styles.typeBadgeText, book.type === "paper" && { color: "#6C63FF" }]}>
            {book.type === "book" ? "BOOK" : "RESEARCH PAPER"}
          </Text>
        </View>

        <Text style={styles.bookTitle}>{book.title}</Text>
        <Text style={styles.bookAuthor}>by {book.author}</Text>

        {/* Availability card */}
        <Card style={styles.availCard}>
          <View style={styles.availRow}>
            <View style={styles.availItem}>
              <Text style={[styles.availNum, { color: COLORS.primary }]}>{book.totalCopies}</Text>
              <Text style={styles.availLabel}>Total</Text>
            </View>
            <View style={styles.availDivider} />
            <View style={styles.availItem}>
              <Text style={[styles.availNum, { color: COLORS.accent }]}>{book.availableCopies}</Text>
              <Text style={styles.availLabel}>Available</Text>
            </View>
            <View style={styles.availDivider} />
            <View style={styles.availItem}>
              <Text style={[styles.availNum, { color: book.totalCopies - book.availableCopies > 0 ? COLORS.danger : COLORS.textMuted }]}>
                {book.totalCopies - book.availableCopies}
              </Text>
              <Text style={styles.availLabel}>On Loan</Text>
            </View>
          </View>
        </Card>

        {/* Book info */}
        <Card>
          <DetailRow icon="location-outline" label="Shelf" value={book.shelfLocation || "Not assigned"} />
          <DetailRow icon="business-outline" label="Library" value={book.libraryName} />
          {book.description ? (
            <DetailRow icon="document-text-outline" label="About" value={book.description} />
          ) : null}
        </Card>

        {/* Tags */}
        {book.tags?.length > 0 && (
          <View style={styles.tagsRow}>
            {book.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Available In */}
        {copies.length > 1 && (
          <>
            <Text style={styles.sectionLabel}>Available In</Text>
            {copies.map((copy) => (
              <Pressable key={copy.id} onPress={() => setSelected(copy)}>
                <Card style={[styles.copyCard, selected?.id === copy.id && styles.copyCardSelected]}>
                  <View style={styles.copyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.copyName}>{copy.libraryName}</Text>
                      <Text style={styles.copyShelf}>Shelf: {copy.shelfLocation || "N/A"}</Text>
                    </View>
                    <View style={styles.copyRight}>
                      <Text style={[styles.copyAvail, { color: copy.availableCopies > 0 ? COLORS.accent : COLORS.danger }]}>
                        {copy.availableCopies}/{copy.totalCopies}
                      </Text>
                      {selected?.id === copy.id && (
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                      )}
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </>
        )}

        {/* Loan Duration */}
        <Text style={styles.sectionLabel}>Loan Duration</Text>

        {/* Preset chips */}
        <View style={styles.presetRow}>
          {PRESET_DURATIONS.map((d) => (
            <Pressable
              key={d}
              onPress={() => {
                setDurationMode("preset");
                setPresetDuration(d);
                setCustomDuration("");
              }}
              style={[
                styles.presetChip,
                durationMode === "preset" && presetDuration === d && styles.presetChipActive,
              ]}
            >
              <Text
                style={[
                  styles.presetChipText,
                  durationMode === "preset" && presetDuration === d && styles.presetChipTextActive,
                ]}
              >
                {d}d
              </Text>
            </Pressable>
          ))}

          {/* Custom chip */}
          <Pressable
            onPress={() => setDurationMode("custom")}
            style={[styles.presetChip, durationMode === "custom" && styles.presetChipActive]}
          >
            <Text style={[styles.presetChipText, durationMode === "custom" && styles.presetChipTextActive]}>
              Custom
            </Text>
          </Pressable>
        </View>

        {/* Custom duration input */}
        {durationMode === "custom" && (
          <View style={styles.customInputWrap}>
            <TextInput
              style={styles.customInput}
              placeholder="Enter days (1–90)"
              placeholderTextColor={COLORS.textMuted}
              value={customDuration}
              onChangeText={setCustomDuration}
              keyboardType="number-pad"
              maxLength={2}
              autoFocus
            />
            <Text style={styles.customInputSuffix}>days</Text>
          </View>
        )}

        {/* Duration summary */}
        {effectiveDuration && (
          <View style={styles.durationSummary}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
            <Text style={styles.durationSummaryText}>
              Requesting for <Text style={styles.durationBold}>{effectiveDuration} days</Text>
            </Text>
          </View>
        )}

        <Button
          title="Submit Borrow Request"
          onPress={handleBorrow}
          loading={submitting}
          disabled={!selected || selected.availableCopies <= 0 || !effectiveDuration}
          style={styles.borrowBtn}
        />

        {selected && selected.availableCopies <= 0 && (
          <Text style={styles.unavailableText}>
            ⚠️ No copies available in the selected library.
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={15} color={COLORS.textMuted} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue} numberOfLines={3}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  notFound: { color: COLORS.textMuted, fontSize: FONT.size.md },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 48,
  },

  // Type badge
  typeBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderRadius: RADIUS.pill, marginBottom: SPACING.sm,
  },
  typeBadgePaper: { backgroundColor: "#EDE9FE" },
  typeBadgeText: {
    fontSize: FONT.size.xs, fontWeight: "800",
    color: COLORS.primary, letterSpacing: 0.5,
  },

  // Title / author
  bookTitle: {
    fontSize: 22, fontWeight: "900", color: COLORS.text,
    marginBottom: 4, lineHeight: 28,
  },
  bookAuthor: {
    fontSize: FONT.size.md, color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },

  // Availability
  availCard: { marginBottom: SPACING.md },
  availRow: { flexDirection: "row", alignItems: "center" },
  availItem: { flex: 1, alignItems: "center", paddingVertical: SPACING.sm },
  availNum: { fontSize: 28, fontWeight: "900" },
  availLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600", marginTop: 2 },
  availDivider: { width: 1, height: 40, backgroundColor: COLORS.border },

  // Detail rows
  detailRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  detailLabel: { fontSize: FONT.size.sm, color: COLORS.textMuted, fontWeight: "600" },
  detailValue: {
    fontSize: FONT.size.sm, color: COLORS.text,
    fontWeight: "600", flex: 1, textAlign: "right", marginLeft: SPACING.sm,
  },

  // Tags
  tagsRow: {
    flexDirection: "row", flexWrap: "wrap",
    gap: SPACING.xs, marginBottom: SPACING.md, marginTop: SPACING.sm,
  },
  tag: {
    backgroundColor: COLORS.background, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: SPACING.sm,
    paddingVertical: 4, borderRadius: RADIUS.pill,
  },
  tagText: { fontSize: FONT.size.xs, color: COLORS.textMuted },

  // Section label
  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: COLORS.textMuted,
    letterSpacing: 0.5, marginBottom: SPACING.sm, marginTop: SPACING.sm,
  },

  // Copies
  copyCard: { marginBottom: SPACING.sm },
  copyCardSelected: { borderColor: COLORS.primary, borderWidth: 2 },
  copyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  copyName: { fontSize: FONT.size.sm, fontWeight: "700", color: COLORS.text },
  copyShelf: { fontSize: FONT.size.xs, color: COLORS.textMuted, marginTop: 2 },
  copyRight: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  copyAvail: { fontSize: FONT.size.md, fontWeight: "800" },

  // Preset duration
  presetRow: {
    flexDirection: "row", gap: SPACING.sm,
    flexWrap: "wrap", marginBottom: SPACING.sm,
  },
  presetChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.card,
    minWidth: 52, alignItems: "center",
  },
  presetChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  presetChipText: { fontSize: FONT.size.sm, fontWeight: "700", color: COLORS.text },
  presetChipTextActive: { color: COLORS.white },

  // Custom input
  customInputWrap: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, backgroundColor: COLORS.card,
    gap: SPACING.sm, marginBottom: SPACING.sm,
  },
  customInput: {
    flex: 1, fontSize: 18, fontWeight: "800",
    color: COLORS.text, padding: 0,
  },
  customInputSuffix: {
    fontSize: FONT.size.sm, color: COLORS.textMuted, fontWeight: "600",
  },

  // Duration summary
  durationSummary: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md, marginBottom: SPACING.sm,
  },
  durationSummaryText: { fontSize: FONT.size.sm, color: COLORS.primary },
  durationBold: { fontWeight: "800" },

  // Borrow button
  borrowBtn: { marginTop: SPACING.md },
  unavailableText: {
    textAlign: "center", color: COLORS.danger,
    fontSize: FONT.size.sm, marginTop: SPACING.sm,
  },
});