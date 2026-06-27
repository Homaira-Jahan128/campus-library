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
import { ScreenHeader } from "@/components/ScreenHeader";
import NotificationPopup from "@/components/NotificationPopup";
import { COLORS, FONT, SPACING } from "@/utils/constants";
import { getBooksByLibrary } from "@/services/bookService";
import { getRequestsByLibrary } from "@/services/requestService";
import { getLoansByLibrary } from "@/services/loanService";

export default function LibrarianDashboard() {
  const { appUser } = useAuth();
  const [stats, setStats] = useState({
    totalItems: 0,
    totalBooks: 0,
    totalPapers: 0,
    activeLoans: 0,
    overdueLoans: 0,
    pendingRequests: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const load = async () => {
    if (!appUser?.libraryId) return;
    const [books, requests, loans] = await Promise.all([
      getBooksByLibrary(appUser.libraryId),
      getRequestsByLibrary(appUser.libraryId),
      getLoansByLibrary(appUser.libraryId),
    ]);
    const activeLoans = loans.filter((l) => l.status === "active");
    setStats({
      totalItems: books.length,
      totalBooks: books.filter((b) => b.type === "book").length,
      totalPapers: books.filter((b) => b.type === "paper").length,
      activeLoans: activeLoans.length,
      overdueLoans: activeLoans.filter((l) => l.fine > 0).length,
      pendingRequests: requests.filter((r) => r.status === "pending").length,
    });
  };

  useEffect(() => { load(); }, [appUser?.libraryId]);

  const TOOLS = [
    {
      id: "add",
      icon: "add-circle",
      label: "Add Book",
      sub: "New book entry",
      color: COLORS.primary,
      route: "/(librarian)/add-book",
    },
    {
      id: "requests",
      icon: "checkmark-done",
      label: "Requests",
      sub: `${stats.pendingRequests} waiting`,
      color: COLORS.danger,
      route: "/(librarian)/requests",
    },
    {
      id: "loans",
      icon: "time",
      label: "Returns Desk",
      sub: `${stats.activeLoans} active`,
      color: COLORS.accent,
      route: "/(librarian)/loans",
    },
  ];

  return (
    <>
      <View style={styles.container}>
        <ScreenHeader
          eyebrow="LIBRARIAN PORTAL"
          title={`Hello, ${appUser?.name?.split(" ")[0] ?? "Librarian"}!`}
          subtitle={appUser?.libraryName}
          rightIcon="notifications-outline"
          onRightPress={() => setShowNotifs(true)}
          badge={stats.pendingRequests > 0}
        />

        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
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
        >
          {/* Hero */}
          <LinearGradient
            colors={[COLORS.primary, "#1a6bb5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroLabel}>LIBRARY INVENTORY</Text>
            <Text style={styles.heroTitle}>
              {stats.totalItems} Item{stats.totalItems !== 1 ? "s" : ""} Total
            </Text>
            <Text style={styles.heroSub}>
              {stats.totalBooks} book{stats.totalBooks !== 1 ? "s" : ""} · {stats.totalPapers} paper{stats.totalPapers !== 1 ? "s" : ""}
            </Text>
            {stats.pendingRequests > 0 && (
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>
                  ⚠️ {stats.pendingRequests} request{stats.pendingRequests > 1 ? "s" : ""} pending
                </Text>
              </View>
            )}
          </LinearGradient>

          {/* Metrics */}
          <Text style={styles.sectionLabel}>LOANS OVERVIEW</Text>
          <View style={styles.metricRow}>
            {[
              { val: stats.activeLoans, label: "ACTIVE LOANS", color: COLORS.primary },
              { val: stats.overdueLoans, label: "OVERDUE", color: COLORS.danger },
              { val: stats.pendingRequests, label: "PENDING", color: COLORS.warning },
            ].map((m, i) => (
              <View key={i} style={styles.metricBox}>
                <Text style={[styles.metricVal, { color: m.color }]}>{m.val}</Text>
                <Text style={styles.metricKey}>{m.label}</Text>
              </View>
            ))}
          </View>

          {/* Tools */}
          <Text style={styles.sectionLabel}>MANAGEMENT TOOLS</Text>
          <View style={styles.toolGrid}>
            {TOOLS.map((tool) => (
              <Pressable
                key={tool.id}
                style={styles.toolCard}
                onPress={() => router.push(tool.route as any)}
              >
                <View style={[styles.toolIcon, { backgroundColor: tool.color + "18" }]}>
                  <Ionicons name={tool.icon as any} size={22} color={tool.color} />
                </View>
                <Text style={styles.toolLabel}>{tool.label}</Text>
                <Text style={styles.toolSub}>{tool.sub}</Text>
              </Pressable>
            ))}
          </View>
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
  heroCard: {
    borderRadius: 22, padding: 22,
    marginTop: 4, marginBottom: 22,
    overflow: "hidden",
  },
  heroLabel: {
    color: "rgba(255,255,255,0.7)", fontSize: 10,
    fontWeight: "700", letterSpacing: 1, marginBottom: 6,
  },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "900", marginBottom: 5 },
  heroSub: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  heroPill: {
    marginTop: 12, backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    alignSelf: "flex-start",
  },
  heroPillText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  sectionLabel: {
    fontSize: 11, fontWeight: "700", letterSpacing: 1,
    color: COLORS.textMuted, marginBottom: 10,
  },
  metricRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  metricBox: {
    flex: 1, borderRadius: 14, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.card,
    paddingVertical: 14, alignItems: "center",
  },
  metricVal: { fontSize: 22, fontWeight: "900" },
  metricKey: {
    fontSize: 8, fontWeight: "700", letterSpacing: 0.5,
    marginTop: 3, color: COLORS.textMuted, textAlign: "center",
  },
  toolGrid: { flexDirection: "row", gap: 10 },
  toolCard: {
    flex: 1, borderRadius: 16, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.card,
    padding: 14, alignItems: "center", gap: 8,
  },
  toolIcon: {
    width: 52, height: 52, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },
  toolLabel: { fontSize: 13, fontWeight: "800", textAlign: "center", color: COLORS.text },
  toolSub: { fontSize: 11, textAlign: "center", color: COLORS.textMuted },
});