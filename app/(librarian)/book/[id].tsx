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
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { COLORS, FONT, RADIUS, SPACING } from "@/utils/constants";
import { BookItem } from "@/types";
import { getBookById, updateBook, deleteBook } from "@/services/bookService";

export default function LibrarianBookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<BookItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Editable fields
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [shelfLocation, setShelfLocation] = useState("");
  const [totalCopies, setTotalCopies] = useState("");
  const [availableCopies, setAvailableCopies] = useState("");
  const [saving, setSaving] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(librarian)/inventory");
    }
  };

  const loadBook = async () => {
    const b = await getBookById(id);
    if (b) {
      setBook(b);
      setTitle(b.title);
      setAuthor(b.author);
      setDescription(b.description);
      setTags(b.tags.join(", "));
      setShelfLocation(b.shelfLocation);
      setTotalCopies(String(b.totalCopies));
      setAvailableCopies(String(b.availableCopies));
    }
    setLoading(false);
  };

  useEffect(() => { loadBook(); }, [id]);

  const handleSave = async () => {
    if (!book) return;
    const total = parseInt(totalCopies, 10);
    const available = parseInt(availableCopies, 10);
    const activeLoans = book.totalCopies - book.availableCopies;

    if (isNaN(total) || total < 1) {
      Alert.alert("Error", "Total copies must be at least 1");
      return;
    }
    if (total < activeLoans) {
      Alert.alert("Error", `Cannot reduce below active loans (${activeLoans})`);
      return;
    }
    if (isNaN(available) || available < 0 || available > total) {
      Alert.alert("Error", "Available copies must be between 0 and total");
      return;
    }

    Alert.alert(
      "Confirm Changes",
      "Are you sure you want to save these changes?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: async () => {
            setSaving(true);
            try {
              await updateBook(book.id, {
                title: title.trim(),
                author: author.trim(),
                description: description.trim(),
                tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                shelfLocation: shelfLocation.trim(),
                totalCopies: total,
                availableCopies: available,
              });
              await loadBook();
              setEditMode(false);
              Alert.alert("Saved ✓", "Item updated successfully.");
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "Could not update item");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Item",
      `Delete "${book?.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!book) return;
            await deleteBook(book.id);
            goBack();
          },
        },
      ]
    );
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
        <Text style={styles.notFound}>Item not found.</Text>
      </View>
    );

  const activeLoans = book.totalCopies - book.availableCopies;

  // ── EDIT MODE ──
  if (editMode) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScreenHeader
          title="Edit Item"
          subtitle={book.title}
          showBack
          onBackPress={() => setEditMode(false)}
        />
        <ScrollView contentContainerStyle={styles.editScroll}>
          {activeLoans > 0 && (
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>
                {activeLoans} cop{activeLoans > 1 ? "ies" : "y"} currently on loan
              </Text>
            </View>
          )}

          <Input label="Title" value={title} onChangeText={setTitle} />
          <Input label="Author" value={author} onChangeText={setAuthor} />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
          <Input label="Tags (comma separated)" value={tags} onChangeText={setTags} />
          <Input label="Shelf Location" value={shelfLocation} onChangeText={setShelfLocation} />
          <Input
            label="Total Copies"
            value={totalCopies}
            onChangeText={setTotalCopies}
            keyboardType="number-pad"
          />
          <Input
            label="Available Copies"
            value={availableCopies}
            onChangeText={setAvailableCopies}
            keyboardType="number-pad"
          />

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={saving}
            style={styles.saveBtn}
          />
          <Button
            title="Delete Item"
            onPress={handleDelete}
            variant="danger"
            style={styles.deleteBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── DETAIL VIEW MODE ──
  return (
    <View style={styles.flex}>
      <ScreenHeader
        title={book.type === "book" ? "Book Details" : "Paper Details"}
        subtitle={book.libraryName}
        showBack
        onBackPress={goBack}
      />
      <ScrollView contentContainerStyle={styles.detailScroll}>

        {/* Type badge + title */}
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
              <Text style={[styles.availNum, { color: activeLoans > 0 ? COLORS.danger : COLORS.textMuted }]}>
                {activeLoans}
              </Text>
              <Text style={styles.availLabel}>On Loan</Text>
            </View>
          </View>
        </Card>

        {/* Details */}
        <Card>
          <DetailRow icon="location-outline" label="Shelf Location" value={book.shelfLocation || "Not assigned"} />
          <DetailRow icon="library-outline" label="Library" value={book.libraryName} />
          {book.description ? (
            <DetailRow icon="document-text-outline" label="Description" value={book.description} />
          ) : null}
        </Card>

        {/* Tags */}
        {book.tags?.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Tags</Text>
            <View style={styles.tagsRow}>
              {book.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Edit button */}
        <Button
          title="Edit This Item"
          onPress={() => setEditMode(true)}
          variant="outline"
          style={styles.editBtn}
        />
      </ScrollView>
    </View>
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

  // Edit mode
  editScroll: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  infoCard: {
    flexDirection: "row", alignItems: "center", gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight, padding: SPACING.md,
    borderRadius: 10, marginBottom: SPACING.md,
  },
  infoText: { color: COLORS.primary, fontWeight: "600", fontSize: FONT.size.sm },
  textArea: { height: 80, textAlignVertical: "top" },
  saveBtn: { marginTop: SPACING.sm },
  deleteBtn: { marginTop: SPACING.sm, marginBottom: SPACING.md },

  // Detail mode
  detailScroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.sm,
  },
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
  bookTitle: {
    fontSize: 22, fontWeight: "900", color: COLORS.text,
    marginBottom: 4, lineHeight: 28,
  },
  bookAuthor: {
    fontSize: FONT.size.md, color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  availCard: { marginBottom: SPACING.md },
  availRow: { flexDirection: "row", alignItems: "center" },
  availItem: { flex: 1, alignItems: "center", paddingVertical: SPACING.sm },
  availNum: { fontSize: 28, fontWeight: "900" },
  availLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600", marginTop: 2 },
  availDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
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
  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: COLORS.textMuted,
    letterSpacing: 0.5, marginBottom: SPACING.sm, marginTop: SPACING.sm,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.xs, marginBottom: SPACING.md },
  tag: {
    backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  tagText: { fontSize: FONT.size.xs, color: COLORS.textMuted },
  editBtn: { marginTop: SPACING.md },
});