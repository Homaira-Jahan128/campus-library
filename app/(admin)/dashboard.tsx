import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { Button } from "@/components/Button";
import { ScreenHeader } from "@/components/ScreenHeader";
import NotificationPopup from "@/components/NotificationPopup";
import { COLORS, FONT, SPACING } from "@/utils/constants";
import { getAllUsers, getPendingLibrarians, setUserStatus } from "@/services/userService";
import { getAllLibraries } from "@/services/libraryService";
import { getAllBooks } from "@/services/bookService";
import { getAllLoans } from "@/services/loanService";
import { createNotification } from "@/services/notificationService";
import { AppUser } from "@/types";
import { calculateFine } from "@/utils/fines";

export default function AdminDashboard() {
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [pendingLibrarians, setPendingLibrarians] = useState<AppUser[]>([]);
  const [processingUid, setProcessingUid] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0, totalStudents: 0, totalLibrarians: 0,
    totalBooks: 0, totalLibraries: 0,
    activeLoans: 0, overdueLoans: 0, totalFines: 0,
  });

  const load = async () => {
    const [users, libraries, books, loans, pending] = await Promise.all([
      getAllUsers(),
      getAllLibraries(),
      getAllBooks(),
      getAllLoans(),
      getPendingLibrarians(),
    ]);
    const activeLoans = loans.filter((l) => l.status === "active");
    setStats({
      totalUsers: users.length,
      totalStudents: users.filter((u) => u.role === "student").length,
      totalLibrarians: users.filter((u) => u.role === "librarian").length,
      totalBooks: books.length,
      totalLibraries: libraries.length,
      activeLoans: activeLoans.length,
      overdueLoans: activeLoans.filter((l) => l.fine > 0).length,
      totalFines: loans.reduce((s, l) => s + (l.status === "active" ? calculateFine(l.dueDate) : l.fine), 0),
    });
    setPendingLibrarians(pending);
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []);

  const handleApprove = async (user: AppUser) => {
    setProcessingUid(user.uid);
    try {
      await setUserStatus(user.uid, "active");
      await createNotification(user.uid, "Account Approved ✓", `Your librarian account for ${user.libraryName} has been approved.`, "librarian_approved");
      await load();
    } catch (e: any) {
      Alert.alert("Error", e?.message);
    } finally {
      setProcessingUid(null);
    }
  };

  const handleReject = async (user: AppUser) => {
    Alert.alert("Reject Request", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          setProcessingUid(user.uid);
          try {
            await setUserStatus(user.uid, "disabled");
            await createNotification(user.uid, "Account Rejected", `Your librarian request for ${user.libraryName} was rejected.`, "librarian_rejected");
            await load();
          } catch (e: any) {
            Alert.alert("Error", e?.message);
          } finally {
            setProcessingUid(null);
          }
        },
      },
    ]);
  };

  return (
    <>
      <View style={styles.container}>
        <ScreenHeader
          eyebrow="CENTRAL ADMIN PORTAL"
          title={`Hello, ${appUser?.name?.split(" ")[0] ?? "Admin"}!`}
          rightIcon="notifications-outline"
          onRightPress={() => setShowNotifs(true)}
          badge={pendingLibrarians.length > 0}
        />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollFlex}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
          >
            <LinearGradient
              colors={["#E5484D", "#FF8080"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <Text style={styles.heroLabel}>SYSTEM OVERVIEW</Text>
              <Text style={styles.heroTitle}>{stats.totalLibraries} Libraries Active</Text>
              <Text style={styles.heroSub}>{stats.totalUsers} users · {stats.totalBooks} books</Text>
              {pendingLibrarians.length > 0 && (
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillText}>⚠️ {pendingLibrarians.length} pending librarian requests</Text>
                </View>
              )}
            </LinearGradient>

            <View style={styles.metricRow}>
              {[
                { val: stats.totalStudents, label: "STUDENTS", color: COLORS.primary },
                { val: stats.totalLibrarians, label: "LIBRARIANS", color: COLORS.accent },
                { val: stats.totalBooks, label: "BOOKS", color: COLORS.text },
              ].map((m, i) => (
                <View key={i} style={styles.metricBox}>
                  <Text style={[styles.metricVal, { color: m.color }]}>{m.val}</Text>
                  <Text style={styles.metricKey}>{m.label}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.metricRow, { marginBottom: 24 }]}>
              {[
                { val: stats.activeLoans, label: "ACTIVE LOANS", color: COLORS.accent },
                { val: stats.overdueLoans, label: "OVERDUE", color: COLORS.danger },
                { val: `৳${stats.totalFines}`, label: "TOTAL FINES", color: COLORS.warning },
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
                { icon: "people", label: "Manage Users", sub: `${stats.totalUsers} total`, color: COLORS.primary, route: "/(admin)/users" },
                { icon: "business", label: "Libraries", sub: `${stats.totalLibraries} active`, color: COLORS.accent, route: "/(admin)/libraries" },
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

            {pendingLibrarians.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Pending Librarian Requests</Text>
                {pendingLibrarians.map((user) => (
                  <Card key={user.uid}>
                    <View style={styles.reqRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.libName}>{user.name}</Text>
                        <Text style={styles.libSub}>{user.email}</Text>
                        <Text style={styles.libSub}>Library: {user.libraryName}</Text>
                      </View>
                      <Badge status="pending" label="PENDING" />
                    </View>
                    <View style={styles.reqBtns}>
                      <Button
                        title="Reject"
                        onPress={() => handleReject(user)}
                        variant="outline"
                        loading={processingUid === user.uid}
                        style={styles.reqBtn}
                      />
                      <Button
                        title="Approve ✓"
                        onPress={() => handleApprove(user)}
                        variant="secondary"
                        loading={processingUid === user.uid}
                        style={styles.reqBtn}
                      />
                    </View>
                  </Card>
                ))}
              </>
            )}
          </ScrollView>
        )}
      </View>
      <NotificationPopup visible={showNotifs} onClose={() => setShowNotifs(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollFlex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroCard: { borderRadius: 22, padding: 22, marginTop: 4, marginBottom: 18, overflow: "hidden" },
  heroLabel: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "900", marginBottom: 4 },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  heroPill: { marginTop: 12, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start" },
  heroPillText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  metricRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  metricBox: { flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card, paddingVertical: 14, alignItems: "center" },
  metricVal: { fontSize: 20, fontWeight: "900" },
  metricKey: { fontSize: 8, fontWeight: "700", letterSpacing: 0.5, marginTop: 3, color: COLORS.textMuted },
  sectionTitle: { fontSize: FONT.heading.section, fontWeight: "800", color: COLORS.text, marginBottom: 12, marginTop: 14 },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  actionCard: { flex: 1, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card, padding: 14 },
  actionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  actionLabel: { fontSize: 13, fontWeight: "800", color: COLORS.text },
  actionSub: { fontSize: 11, marginTop: 3, color: COLORS.textMuted },
  reqRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  reqBtns: { flexDirection: "row", gap: 10 },
  reqBtn: { flex: 1 },
  libName: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  libSub: { fontSize: 12, marginTop: 2, color: COLORS.textMuted },
});