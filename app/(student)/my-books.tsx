import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ScreenHeader } from "@/components/ScreenHeader";
import { COLORS, FONT, SPACING } from "@/utils/constants";
import { Loan, LoanRequest } from "@/types";
import { getLoansByUser } from "@/services/loanService";
import { getRequestsByUser } from "@/services/requestService";
import { daysUntil, formatDate } from "@/utils/fines";

function getTimeLeft(deadline?: number): string {
  if (!deadline) return "";
  const diff = deadline - Date.now();
  if (diff <= 0) return "Collection time expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `Collect within ${hours}h ${minutes}m`;
  return `Collect within ${minutes} minutes!`;
}

export default function MyBooks() {
  const { appUser } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [pendingCollect, setPendingCollect] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!appUser) return;
    const [loanData, requestData] = await Promise.all([
      getLoansByUser(appUser.uid),
      getRequestsByUser(appUser.uid),
    ]);
    setLoans(loanData);
    setPendingCollect(
      requestData.filter((r) => r.status === "approved_pending_collection")
    );
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [appUser?.uid]);

  const activeLoans = loans.filter((l) => l.status === "active");
  const pastLoans = loans.filter((l) => l.status === "returned");
  const totalFine = activeLoans.reduce((s, l) => s + l.fine, 0);

  return (
    <View style={styles.container}>
      <ScreenHeader title="My Books" subtitle="Loans, collections & history" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
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
          {/* Outstanding fine */}
          {totalFine > 0 && (
            <Card style={styles.fineCard}>
              <Text style={styles.fineLabel}>Outstanding Fine</Text>
              <Text style={styles.fineAmount}>{totalFine} BDT</Text>
            </Card>
          )}

          {/* Ready to collect */}
          {pendingCollect.length > 0 && (
            <>
              <Text style={styles.section}>Ready to Collect</Text>
              {pendingCollect.map((req) => (
                <Card key={req.id} style={styles.collectCard}>
                  <View style={styles.collectTop}>
                    <View style={styles.collectIconWrap}>
                      <Ionicons name="bag-check-outline" size={22} color={COLORS.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{req.bookTitle}</Text>
                      <Text style={styles.muted}>{req.libraryName}</Text>
                      <Text style={styles.muted}>Duration: {req.loanDurationDays} days</Text>
                    </View>
                  </View>
                  {req.collectionDeadline && (
                    <View style={styles.deadlinePill}>
                      <Ionicons name="time-outline" size={12} color={COLORS.warning} />
                      <Text style={styles.deadlineText}>
                        {getTimeLeft(req.collectionDeadline)}
                      </Text>
                    </View>
                  )}
                </Card>
              ))}
            </>
          )}

          {/* Active loans */}
          <Text style={styles.section}>Active Loans</Text>
          {activeLoans.length === 0 ? (
            <Card>
              <Text style={styles.muted}>No active loans.</Text>
            </Card>
          ) : (
            activeLoans.map((loan) => (
              <Card key={loan.id}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{loan.bookTitle}</Text>
                    <Text style={styles.muted}>{loan.libraryName}</Text>
                    <Text style={styles.muted}>Due: {formatDate(loan.dueDate)}</Text>
                    {loan.fine > 0 && (
                      <Text style={styles.fine}>Fine: {loan.fine} BDT</Text>
                    )}
                  </View>
                  <Badge
                    status={daysUntil(loan.dueDate) < 0 ? "overdue" : "active"}
                    label={
                      daysUntil(loan.dueDate) < 0
                        ? "Overdue"
                        : `${daysUntil(loan.dueDate)}d left`
                    }
                  />
                </View>
              </Card>
            ))
          )}

          {/* History */}
          <Text style={styles.section}>History</Text>
          {pastLoans.length === 0 ? (
            <Card>
              <Text style={styles.muted}>No past loans.</Text>
            </Card>
          ) : (
            pastLoans.map((loan) => (
              <Card key={loan.id}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{loan.bookTitle}</Text>
                    <Text style={styles.muted}>{loan.libraryName}</Text>
                    <Text style={styles.muted}>
                      Returned: {loan.returnedAt ? formatDate(loan.returnedAt) : "-"}
                    </Text>
                    {loan.fine > 0 && (
                      <Text style={styles.fine}>Fine: {loan.fine} BDT</Text>
                    )}
                  </View>
                  <Badge status="returned" label="Returned" />
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  section: {
    fontSize: FONT.heading.section,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  fineCard: { backgroundColor: "#FBE3E3", borderColor: COLORS.danger },
  fineLabel: { color: COLORS.danger, fontWeight: "600" },
  fineAmount: {
    color: COLORS.danger,
    fontSize: FONT.size.xl,
    fontWeight: "800",
    marginTop: 4,
  },
  collectCard: {
    borderColor: COLORS.accent,
    borderWidth: 2,
    backgroundColor: "#F0FBF4",
  },
  collectTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  collectIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E1F5EA",
    alignItems: "center",
    justifyContent: "center",
  },
  deadlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3D6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  deadlineText: { fontSize: 11, fontWeight: "700", color: COLORS.warning },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: { fontSize: FONT.size.md, fontWeight: "700", color: COLORS.text },
  muted: { color: COLORS.textMuted, fontSize: FONT.size.sm, marginTop: 2 },
  fine: {
    color: COLORS.danger,
    fontWeight: "700",
    fontSize: FONT.size.sm,
    marginTop: 2,
  },
});