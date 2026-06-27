import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/components/Input";
import { Card } from "@/components/Card";
import { ScreenHeader } from "@/components/ScreenHeader";
import { COLORS, FONT, RADIUS, SPACING } from "@/utils/constants";
import { BookItem, ItemType } from "@/types";
import { getAllBooks, filterBooks } from "@/services/bookService";

const TYPE_FILTERS: { label: string; value: ItemType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Books", value: "book" },
  { label: "Papers", value: "paper" },
];

export default function StudentSearch() {
  const [allBooks, setAllBooks] = useState<BookItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [typeFilter, setTypeFilter] = useState<ItemType | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllBooks()
      .then(setAllBooks)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedText(searchText), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  const results = useMemo(
    () => filterBooks(allBooks, debouncedText, typeFilter),
    [allBooks, debouncedText, typeFilter]
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Search Library" subtitle="Find books and papers" />

      <View style={styles.searchSection}>
        <Input
          placeholder="Search by title, author, or tag"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
        <View style={styles.filterRow}>
          {TYPE_FILTERS.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => setTypeFilter(f.value)}
              style={[styles.chip, typeFilter === f.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, typeFilter === f.value && styles.chipTextActive]}>
                {f.label}
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
          ListHeaderComponent={
            debouncedText.length > 0 ? (
              <Text style={styles.resultCount}>
                {results.length} result{results.length !== 1 ? "s" : ""} for "{debouncedText}"
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={40} color={COLORS.border} />
              <Text style={styles.emptyText}>
                {debouncedText.length > 0 ? "No items found." : "Start typing to search."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/(student)/book/${item.id}`)}>
              <Card>
                <Text style={styles.title2}>{item.title}</Text>
                <Text style={styles.author}>by {item.author}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{item.libraryName}</Text>
                  <Text
                    style={[
                      styles.meta,
                      { color: item.availableCopies > 0 ? COLORS.accent : COLORS.danger },
                    ]}
                  >
                    {item.availableCopies > 0
                      ? `${item.availableCopies} available`
                      : "Not available"}
                  </Text>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchSection: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  searchInput: { marginBottom: 0 },
  filterRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill, borderWidth: 1,
    borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.text, fontSize: FONT.size.sm, fontWeight: "600" },
  chipTextActive: { color: COLORS.white },
  list: { padding: SPACING.lg, paddingTop: SPACING.sm },
  resultCount: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600", marginBottom: SPACING.sm },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title2: { fontSize: FONT.size.md, fontWeight: "700", color: COLORS.text },
  author: { color: COLORS.textMuted, marginTop: 2 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: SPACING.sm },
  meta: { fontSize: FONT.size.xs, color: COLORS.textMuted, fontWeight: "600" },
  emptyWrap: { alignItems: "center", paddingTop: SPACING.xl * 1.5, gap: SPACING.sm },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
});