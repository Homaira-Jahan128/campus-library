import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ScreenHeader } from "@/components/ScreenHeader";
import { COLORS, FONT, SPACING } from "@/utils/constants";
import { Loan } from "@/types";
import { getLoansByLibrary, returnLoan } from "@/services/loanService";
import { adjustAvailableCopies } from "@/services/bookService";
import { createNotification } from "@/services/notificationService";
import { daysUntil, formatDate } from "@/utils/fines";

export default function LibrarianLoans() {
  const { appUser } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "returned">("all");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    if (!appUser?.libraryId) return;
    const data = await getLoansByLibrary(appUser.libraryId);
    setLoans(data);
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [appUser?.libraryId]);

  const filtered = useMemo(() => {
    let result = filter === "all" ? loans : loans.filter((l) => l.status === filter);
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(
        (l) =>
          (l.userRoll ?? "").toLowerCase().includes(q) ||
          (l.userDepartment ?? "").toLowerCase().includes(q) ||
          l.bookTitle.toLowerCase().includes(q) ||
          l.userId.toLowerCase().includes(q)
      );
    }
    return result;
  }, [loans, filter, searchText]);

  const activeCount = loans.filter((l) => l.status === "active").length;
  const overdueCount = loans.filter(
    (l) => l.status === "active" && daysUntil(l.dueDate) < 0
  ).length;

  const handleReturn = async (loan: Loan) => {
    Alert.alert(
      "Confirm Return",
      `Mark "${loan.bookTitle}" as returned by ${loan.userName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setProcessingId(loan.id);
            try {
              const fine = await returnLoan(loan.id, loan.dueDate);
              await adjustAvailableCopies(loan.bookId, 1);
              await createNotification(
                loan.userId,
                "Book Returned",
                `"${loan.bookTitle}" returned.${fine > 0 ? ` Fine: ${fine} BDT.` : ""}`,
                "book_returned"
              );
              await load();
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "Could not process return");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Loans"
        subtitle={`${activeCount} active · ${overdueCount} overdue`}
      />

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student Id or book..."
            placeholderTextColor={COLORS.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(["all", "active", "returned"] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {searchText.length > 0 && (
        <Text style={styles.resultCount}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{searchText}"
        </Text>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>
                {searchText ? "No matching loans." : "No loans found."}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const overdue = item.status === "active" && daysUntil(item.dueDate) < 0;
            return (
              <View style={[styles.card, overdue && styles.cardOverdue]}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookTitle}>{item.bookTitle}</Text>

                  </View>
                  <Badge
                    status={
                      item.status === "returned"
                        ? "returned"
                        : overdue
                          ? "overdue"
                          : "active"
                    }
                    label={
                      item.status === "returned"
                        ? "Returned"
                        : overdue
                          ? "Overdue"
                          : `${daysUntil(item.dueDate)}d left`
                    }
                  />
                </View>
                {/* Student info */}
                <View style={styles.studentCard}>
                  <View style={styles.studentRow}>
                    <Ionicons name="card-outline" size={13} color={COLORS.primary} />
                    <Text style={styles.studentRoll}>
                      {item.userRoll ?? item.userId.slice(0, 8).toUpperCase()}
                    </Text>
                  </View>
                  {item.userDepartment && (
                    <View style={styles.studentRow}>
                      <Ionicons name="business-outline" size={13} color={COLORS.textMuted} />
                      <Text style={styles.studentDept} numberOfLines={1}>
                        {item.userDepartment}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.studentRow}>
                  <Ionicons name="person-circle-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.studentName}>{item.userName}</Text>
                </View>
                <Text style={styles.muted}>
                  Due: {formatDate(item.dueDate)}
                  {item.returnedAt ? ` · Returned: ${formatDate(item.returnedAt)}` : ""}
                </Text>
                {item.fine > 0 && (
                  <Text style={styles.fine}>Fine: {item.fine} BDT</Text>
                )}
                {item.status === "active" && (
                  <Button
                    title="Mark as Returned"
                    onPress={() => handleReturn(item)}
                    variant="secondary"
                    loading={processingId === item.id}
                    style={styles.returnBtn}
                  />
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchWrap: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, padding: 0 },
  filterRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.text, fontSize: FONT.size.sm, fontWeight: "600" },
  chipTextActive: { color: COLORS.white },
  resultCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  list: { padding: SPACING.lg, paddingTop: SPACING.sm },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyContainer: { alignItems: "center", paddingTop: SPACING.xl, gap: SPACING.sm },
  emptyText: { color: COLORS.textMuted, fontSize: FONT.size.md },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  cardOverdue: { borderColor: COLORS.danger, backgroundColor: "#FFF8F8" },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  bookTitle: { fontSize: FONT.size.md, fontWeight: "700", color: COLORS.text },
  // studentRow: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: 4,
  //   marginTop: 4,
  //   marginBottom: 2,
  // },
  studentName: {
    fontSize: FONT.size.sm,
    fontWeight: "700",
    color: COLORS.primary,
  },
  muted: { color: COLORS.textMuted, fontSize: FONT.size.sm, marginTop: 2 },
  fine: { color: COLORS.danger, fontWeight: "700", fontSize: FONT.size.sm, marginTop: 2 },
  returnBtn: { marginTop: SPACING.md },

  studentCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    gap: 4,

  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  studentRoll: {
    fontSize: FONT.size.sm,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  studentDept: {
    fontSize: FONT.size.xs,
    color: COLORS.textMuted,
    fontWeight: "600",
    flex: 1,
  },
});