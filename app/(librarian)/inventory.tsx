import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/Input";
import { ScreenHeader } from "@/components/ScreenHeader";
import { COLORS, FONT, RADIUS, SPACING } from "@/utils/constants";
import { BookItem, ItemType } from "@/types";
import { getBooksByLibrary, filterBooks } from "@/services/bookService";

export default function LibrarianInventory() {
  const { appUser } = useAuth();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<ItemType | "all">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!appUser?.libraryId) return;
    const data = await getBooksByLibrary(appUser.libraryId);
    setBooks(data);
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [appUser?.libraryId]);

  const results = useMemo(
    () => filterBooks(books, searchText, typeFilter),
    [books, searchText, typeFilter]
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Inventory"
        subtitle={`${books.length} item${books.length !== 1 ? "s" : ""} total`}
        rightIcon="add"
        onRightPress={() => router.push("/(librarian)/add-book")}
      />

      <View style={styles.searchArea}>
        <Input
          placeholder="Search inventory..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
        <View style={styles.filterRow}>
          {(["all", "book", "paper"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setTypeFilter(f)}
              style={[styles.chip, typeFilter === f && styles.chipActive]}
            >
              <Text style={[styles.chipText, typeFilter === f && styles.chipTextActive]}>
                {f === "all" ? "All" : f === "book" ? "Books" : "Papers"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="library-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No items in inventory yet.</Text>
              <Text style={styles.emptySubText}>Tap the + button to add your first item.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(librarian)/book/${item.id}`)}
              style={styles.bookCard}
            >
              <View style={[styles.typeIndicator, { backgroundColor: item.type === "book" ? COLORS.primary : "#6C63FF" }]} />
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <Text style={styles.bookAuthor}>by {item.author}</Text>
                <Text style={styles.bookShelf}>
                  <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                  {" "}{item.shelfLocation || "No shelf assigned"}
                </Text>
              </View>
              <View style={styles.copiesBox}>
                <Text style={[styles.copiesNum, { color: item.availableCopies > 0 ? COLORS.accent : COLORS.danger }]}>
                  {item.availableCopies}
                </Text>
                <Text style={styles.copiesLabel}>/ {item.totalCopies}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchArea: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  searchInput: { marginBottom: SPACING.sm },
  filterRow: { flexDirection: "row", gap: SPACING.sm },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.text, fontSize: FONT.size.sm, fontWeight: "600" },
  chipTextActive: { color: COLORS.white },
  list: { padding: SPACING.lg, paddingTop: SPACING.sm },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingTop: SPACING.xl, gap: SPACING.sm },
  emptyText: { fontSize: FONT.size.md, fontWeight: "700", color: COLORS.text },
  emptySubText: { color: COLORS.textMuted },
  bookCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderRadius: 12, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  typeIndicator: { width: 4, alignSelf: "stretch" },
  bookInfo: { flex: 1, padding: SPACING.md },
  bookTitle: { fontSize: FONT.size.md, fontWeight: "700", color: COLORS.text },
  bookAuthor: { color: COLORS.textMuted, fontSize: FONT.size.sm, marginTop: 2 },
  bookShelf: { color: COLORS.textMuted, fontSize: FONT.size.xs, marginTop: 4 },
  copiesBox: { padding: SPACING.md, alignItems: "center" },
  copiesNum: { fontSize: FONT.size.lg, fontWeight: "800" },
  copiesLabel: { fontSize: FONT.size.xs, color: COLORS.textMuted },
});