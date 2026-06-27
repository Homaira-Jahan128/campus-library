import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/components/Input";
import { ScreenHeader } from "@/components/ScreenHeader";
import { COLORS, FONT, RADIUS, SPACING } from "@/utils/constants";
import { Library, AppUser, BookItem, Loan, LoanRequest } from "@/types";
import { getAllLibraries } from "@/services/libraryService";
import { getAllUsers } from "@/services/userService";
import { getAllBooks } from "@/services/bookService";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";

interface LibraryStats extends Library {
  librarianNames: string[];
  bookCount: number;
  activeLoans: number;
  pendingRequests: number;
  overdueLoans: number;
}

export default function AdminLibraries() {
  const [libraries, setLibraries] = useState<LibraryStats[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState<"all" | "central" | "department">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [libs, users, books, loanSnap, reqSnap] = await Promise.all([
        getAllLibraries(),
        getAllUsers(),
        getAllBooks(),
        getDocs(collection(db, "loans")),
        getDocs(collection(db, "loanRequests")),
      ]);
      const loans = loanSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Loan));
      const requests = reqSnap.docs.map((d) => ({ id: d.id, ...d.data() } as LoanRequest));

      const enriched: LibraryStats[] = libs.map((lib) => {
        const librarians = users.filter(
          (u: AppUser) => u.role === "librarian" && u.libraryId === lib.id && u.status === "active"
        );
        const libBooks = books.filter((b: BookItem) => b.libraryId === lib.id);
        const libActiveLoans = loans.filter((l) => l.libraryId === lib.id && l.status === "active");
        const libPendingRequests = requests.filter((r) => r.libraryId === lib.id && r.status === "pending");

        return {
          ...lib,
          librarianNames: librarians.map((l) => l.name),
          bookCount: libBooks.length,
          activeLoans: libActiveLoans.length,
          pendingRequests: libPendingRequests.length,
          overdueLoans: libActiveLoans.filter((l) => l.fine > 0).length,
        };
      });

      setLibraries(enriched);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return libraries.filter((l) => {
      const typeMatch = filter === "all" || l.type === filter;
      if (!typeMatch) return false;
      if (!text) return true;
      return (
        l.name.toLowerCase().includes(text) ||
        (l.department ?? "").toLowerCase().includes(text) ||
        (l.faculty ?? "").toLowerCase().includes(text)
      );
    });
  }, [libraries, searchText, filter]);

  const counts = useMemo(
    () => ({
      all: libraries.length,
      central: libraries.filter((l) => l.type === "central").length,
      department: libraries.filter((l) => l.type === "department").length,
    }),
    [libraries]
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Libraries" subtitle={`${libraries.length} total`} />

      <View style={styles.searchWrap}>
        <Input
          placeholder="Search by department or faculty..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterRow}>
        {[
          { label: "All", value: "all" as const, count: counts.all },
          { label: "Central", value: "central" as const, count: counts.central },
          { label: "Seminar", value: "department" as const, count: counts.department },
        ].map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setFilter(f.value)}
            style={[styles.chip, filter === f.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f.value && styles.chipTextActive]}>
              {f.label} ({f.count})
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="business-outline" size={40} color={COLORS.border} />
              <Text style={styles.emptyText}>No libraries found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, item.type === "central" && styles.cardCentral]}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.libName}>{item.name}</Text>
                  <Text style={styles.libSub}>
                    {item.type === "central" ? "Administrative Building, RU Campus" : item.faculty}
                  </Text>
                </View>
                <View style={[styles.typeTag, item.type === "central" && styles.typeTagCentral]}>
                  <Text style={[styles.typeTagText, item.type === "central" && styles.typeTagTextCentral]}>
                    {item.type === "central" ? "CENTRAL" : "SEMINAR"}
                  </Text>
                </View>
              </View>

              <View style={styles.librarianRow}>
                <Ionicons name="person-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.librarianText}>
                  {item.librarianNames.length > 0 ? item.librarianNames.join(", ") : "No librarian assigned"}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.statsRow}>
                <StatItem label="Books" value={item.bookCount} />
                <StatItem label="Active" value={item.activeLoans} color={COLORS.accent} />
                <StatItem label="Pending" value={item.pendingRequests} color={COLORS.warning} />
                <StatItem label="Overdue" value={item.overdueLoans} color={COLORS.danger} />
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  searchWrap: { paddingHorizontal: 20 },
  searchInput: { marginBottom: 0 },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  chipTextActive: { color: COLORS.white },
  list: { padding: 20, paddingTop: 4 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border, padding: 16, marginBottom: 12 },
  cardCentral: { borderColor: COLORS.danger, borderWidth: 2 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  libName: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  libSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  typeTag: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeTagCentral: { backgroundColor: "#FBE3E3" },
  typeTagText: { fontSize: 10, fontWeight: "800", color: COLORS.primary },
  typeTagTextCentral: { color: COLORS.danger },
  librarianRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  librarianText: { fontSize: 12, color: COLORS.textMuted, fontStyle: "italic", flex: 1 },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 12 },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "900", color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, fontWeight: "600" },
  emptyWrap: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
});