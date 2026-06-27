import React, { useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ScreenHeader } from "@/components/ScreenHeader";
import NotificationPopup from "@/components/NotificationPopup";
import { COLORS, FONT, SPACING } from "@/utils/constants";
import { Loan, BookItem } from "@/types";
import { getLoansByUser } from "@/services/loanService";
import { getAllBooks } from "@/services/bookService";

export default function StudentHome() {
  const { appUser } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [recentBooks, setRecentBooks] = useState<BookItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const hour = new Date().getHours();
const greeting = hour < 12 ? "Good Morning 🌤️" : hour < 18 ? "Good Afternoon ☀️" : "Good Evening 🌙";

  const load = async () => {
    if (!appUser) return;
    const [l, books] = await Promise.all([
      getLoansByUser(appUser.uid),
      getAllBooks(),
    ]);
    setLoans(l);
    setRecentBooks(books.slice(0, 3));
  };

  useEffect(() => { load(); }, [appUser?.uid]);

  const activeLoans = loans.filter((l) => l.status === "active");
  const overdueCount = activeLoans.filter((l) => l.fine > 0).length;
  const pendingCount = 0;

  return (
    <>
      <View style={styles.container}>
        <ScreenHeader
          eyebrow={greeting}
          title={`Hello, ${appUser?.name?.split(" ")[0] ?? "Student"}!`}
          subtitle={`${appUser?.department ?? ""}${appUser?.session ? ` · ${appUser.session}` : ""}`}
          rightIcon="notifications-outline"
          onRightPress={() => setShowNotifs(true)}
          badge={overdueCount > 0}
        />

        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />
          }
        >
          <LinearGradient
            colors={[COLORS.primary, "#1a6bb5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroOverline}>MY LIBRARY OVERVIEW</Text>
            <Text style={styles.heroTitle}>
              {activeLoans.length > 0
                ? `${activeLoans.length} Book${activeLoans.length > 1 ? "s" : ""} Borrowed`
                : "No Active Loans"}
            </Text>
            <Text style={styles.heroSub}>
              {overdueCount > 0
                ? `⚠️ ${overdueCount} book overdue — return soon!`
                : activeLoans.length > 0
                  ? "All loans on track ✓"
                  : "Search and borrow a book today."}
            </Text>
            <Ionicons name="school" size={80} color="rgba(255,255,255,0.12)" style={styles.watermark} />
          </LinearGradient>

          <View style={styles.metricRow}>
            {[
              { val: activeLoans.length, label: "BORROWED", color: COLORS.primary },
              { val: pendingCount, label: "PENDING", color: COLORS.warning },
              { val: overdueCount, label: "OVERDUE", color: COLORS.danger },
            ].map((m, i) => (
              <View key={i} style={styles.metricBox}>
                <Text style={[styles.metricVal, { color: m.color }]}>{m.val}</Text>
                <Text style={styles.metricKey}>{m.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            {[
              { icon: "search", label: "Search Books", sub: "Find & reserve", color: COLORS.primary, route: "/(student)/search" },
              { icon: "book", label: "My Loans", sub: "Track due dates", color: COLORS.accent, route: "/(student)/my-books" },
            ].map((item) => (
              <Pressable
                key={item.label}
                style={styles.actionCard}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: item.color + "18" }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={styles.actionLabel}>{item.label}</Text>
                <Text style={styles.actionSub}>{item.sub}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Added</Text>
            <Pressable onPress={() => router.push("/(student)/search")}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          {recentBooks.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="book-outline" size={36} color={COLORS.border} />
              <Text style={styles.emptyText}>No books available yet.</Text>
            </View>
          ) : (
            recentBooks.map((book) => (
              <Pressable
                key={book.id}
                onPress={() => router.push(`/(student)/book/${book.id}`)}
              >
                <Card>
                  <View style={styles.bookRow}>
                    <View style={styles.bookIcon}>
                      <Ionicons
                        name={book.type === "paper" ? "document-text" : "book"}
                        size={22}
                        color={book.availableCopies > 0 ? COLORS.accent : COLORS.textMuted}
                      />
                    </View>
                    <View style={styles.bookInfo}>
                      <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
                      <Text style={styles.bookAuthor}>{book.author} · {book.libraryName}</Text>
                      <Badge
                        status={book.availableCopies > 0 ? "active" : "rejected"}
                        label={book.availableCopies > 0 ? `${book.availableCopies} Available` : "Not Available"}
                      />
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
      <NotificationPopup visible={showNotifs} onClose={() => setShowNotifs(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollFlex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  heroCard: { borderRadius: 22, padding: 22, marginTop: 4, marginBottom: 18, overflow: "hidden", position: "relative" },
  heroOverline: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "900", marginBottom: 4 },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  watermark: { position: "absolute", right: -10, bottom: -14, transform: [{ rotate: "-12deg" }] },
  metricRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  metricBox: {
    flex: 1, borderRadius: 14, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.card,
    paddingVertical: 14, alignItems: "center",
  },
  metricVal: { fontSize: 24, fontWeight: "900" },
  metricKey: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5, marginTop: 3, color: COLORS.textMuted },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: FONT.heading.section, fontWeight: "800", color: COLORS.text, marginBottom: 12 },
  seeAll: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  actionCard: {
    flex: 1, borderRadius: 16, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.card, padding: 14,
  },
  actionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  actionLabel: { fontSize: 13, fontWeight: "800", color: COLORS.text },
  actionSub: { fontSize: 11, marginTop: 3, color: COLORS.textMuted },
  bookRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  bookIcon: { width: 48, height: 58, borderRadius: 10, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center" },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 3 },
  bookAuthor: { fontSize: 12, color: COLORS.textMuted, marginBottom: 7 },
  emptyWrap: { alignItems: "center", paddingTop: 32, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
});