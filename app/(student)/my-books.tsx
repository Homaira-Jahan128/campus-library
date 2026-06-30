import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ScreenHeader } from "@/components/ScreenHeader";
import { COLORS, FONT, RADIUS, SPACING } from "@/utils/constants";
import { Loan, LoanRequest } from "@/types";
import { getLoansByUser } from "@/services/loanService";
import { getRequestsByUser } from "@/services/requestService";
import {
  submitRenewalRequest,
  hasPendingRenewal,
} from "@/services/renewalService";
import { createNotification } from "@/services/notificationService";
import { daysUntil, formatDate } from "@/utils/fines";

const PRESET_DAYS = [7, 14, 21, 30];

function RenewModal({
  visible,
  loan,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  loan: Loan | null;
  onClose: () => void;
  onSubmit: (days: number) => void;
}) {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [preset, setPreset] = useState(7);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);

  const effectiveDays =
    mode === "preset" ? preset : parseInt(custom, 10) || 0;

  const handleSubmit = async () => {
    if (!effectiveDays || effectiveDays < 1 || effectiveDays > 90) {
      Alert.alert("Error", "Please enter a valid number of days (1–90).");
      return;
    }
    setLoading(true);
    await onSubmit(effectiveDays);
    setLoading(false);
    onClose();
  };

  return (
  <Modal visible={visible} transparent animationType="slide">
    <KeyboardAvoidingView
      style={modal.overlay}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={modal.panel}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={modal.header}>
            <Text style={modal.title}>Renew Book</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={COLORS.textMuted} />
            </Pressable>
          </View>

          {loan && (
            <View style={modal.bookInfo}>
              <Text style={modal.bookTitle} numberOfLines={2}>
                {loan.bookTitle}
              </Text>
              <Text style={modal.bookSub}>
                Current due: {formatDate(loan.dueDate)}
              </Text>
            </View>
          )}

          <Text style={modal.label}>Extension Duration</Text>
          <View style={modal.presetRow}>
            {PRESET_DAYS.map((d) => (
              <Pressable
                key={d}
                onPress={() => {
                  setMode("preset");
                  setPreset(d);
                  setCustom("");
                }}
                style={[
                  modal.chip,
                  mode === "preset" && preset === d && modal.chipActive,
                ]}
              >
                <Text
                  style={[
                    modal.chipText,
                    mode === "preset" && preset === d && modal.chipTextActive,
                  ]}
                >
                  {d}d
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setMode("custom")}
              style={[modal.chip, mode === "custom" && modal.chipActive]}
            >
              <Text
                style={[
                  modal.chipText,
                  mode === "custom" && modal.chipTextActive,
                ]}
              >
                Custom
              </Text>
            </Pressable>
          </View>

          {mode === "custom" && (
            <View style={modal.customWrap}>
              <TextInput
                style={modal.customInput}
                placeholderTextColor={COLORS.textMuted}
                value={custom}
                onChangeText={setCustom}
                keyboardType="number-pad"
                maxLength={2}
                autoFocus
              />
              <Text style={modal.customSuffix}>days</Text>
            </View>
          )}

          {effectiveDays > 0 && loan && (
            <View style={modal.summaryCard}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
              <Text style={modal.summaryText}>
                New due date:{" "}
                <Text style={modal.summaryBold}>
                  {formatDate(
                    loan.dueDate + effectiveDays * 24 * 60 * 60 * 1000
                  )}
                </Text>
              </Text>
            </View>
          )}

          <Text style={modal.note}>
            ℹ️ The librarian will review your renewal request.
          </Text>

          <Button
            title="Submit Renewal Request"
            onPress={handleSubmit}
            loading={loading}
            disabled={effectiveDays < 1}
            style={modal.btn}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);
}

export default function MyBooks() {
  const { appUser } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [pendingCollect, setPendingCollect] = useState<LoanRequest[]>([]);
  const [pendingRenewals, setPendingRenewals] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [renewModal, setRenewModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

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

    // Check which active loans have pending renewals
    const activeLoans = loanData.filter((l) => l.status === "active");
    const renewalChecks = await Promise.all(
      activeLoans.map(async (l) => ({
        id: l.id,
        pending: await hasPendingRenewal(l.id),
      }))
    );
    const pendingSet = new Set(
      renewalChecks.filter((r) => r.pending).map((r) => r.id)
    );
    setPendingRenewals(pendingSet);
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [appUser?.uid]);

  const handleRenewPress = (loan: Loan) => {
    setSelectedLoan(loan);
    setRenewModal(true);
  };

  const handleRenewSubmit = async (days: number) => {
    if (!appUser || !selectedLoan) return;
    try {
      await submitRenewalRequest({
        loanId: selectedLoan.id,
        bookId: selectedLoan.bookId,
        bookTitle: selectedLoan.bookTitle,
        userId: appUser.uid,
        userName: appUser.name,
        userRoll: appUser.rollNumber,
        userDepartment: appUser.department,
        libraryId: selectedLoan.libraryId,
        libraryName: selectedLoan.libraryName,
        currentDueDate: selectedLoan.dueDate,
        requestedDays: days,
      });
      await createNotification(
        appUser.uid,
        "Renewal Requested 🔄",
        `Your renewal request for "${selectedLoan.bookTitle}" (${days} days) has been sent to ${selectedLoan.libraryName}.`,
        "request_submitted"
      );
      await load();
      Alert.alert("Request Sent ✓", "Your renewal request has been submitted. The librarian will review it.");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not submit renewal.");
    }
  };

  const activeLoans = loans.filter((l) => l.status === "active");
  const pastLoans = loans.filter((l) => l.status === "returned");
  const totalFine = activeLoans.reduce((s, l) => s + l.fine, 0);

  return (
    <View style={styles.container}>
      <ScreenHeader title="My Books" subtitle="Loans, renewals & history" />

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
                      <Ionicons
                        name="bag-check-outline"
                        size={22}
                        color={COLORS.accent}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{req.bookTitle}</Text>
                      <Text style={styles.muted}>{req.libraryName}</Text>
                      <Text style={styles.muted}>
                        Duration: {req.loanDurationDays} days
                      </Text>
                    </View>
                  </View>
                  {req.collectionDeadline && (
                    <View style={styles.deadlinePill}>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color={COLORS.warning}
                      />
                      <Text style={styles.deadlineText}>
                        Collect before:{" "}
                        {formatDate(req.collectionDeadline)}
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
            activeLoans.map((loan) => {
              const overdue = daysUntil(loan.dueDate) < 0;
              const hasPending = pendingRenewals.has(loan.id);
              return (
                <Card
                  key={loan.id}
                  style={overdue ? styles.overdueCard : undefined}
                >
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{loan.bookTitle}</Text>
                      <Text style={styles.muted}>{loan.libraryName}</Text>
                      <Text style={styles.muted}>
                        Due: {formatDate(loan.dueDate)}
                      </Text>
                      {overdue && (
                        <Text style={styles.daysLeft}>
                          {Math.abs(daysUntil(loan.dueDate))} day(s) overdue
                        </Text>
                      )}
                      {!overdue && daysUntil(loan.dueDate) <= 3 && (
                        <Text style={styles.dueSoon}>
                          ⚠️ Due in {daysUntil(loan.dueDate)} day(s)
                        </Text>
                      )}
                      {loan.fine > 0 && (
                        <Text style={styles.fine}>
                          Fine: {loan.fine} BDT
                        </Text>
                      )}
                    </View>
                    <Badge
                      status={overdue ? "overdue" : "active"}
                      label={
                        overdue
                          ? "Overdue"
                          : `${daysUntil(loan.dueDate)}d left`
                      }
                    />
                  </View>

                  {/* Renew button */}
                  <View style={styles.renewRow}>
                    {hasPending ? (
                      <View style={styles.pendingRenewalPill}>
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color={COLORS.warning}
                        />
                        <Text style={styles.pendingRenewalText}>
                          Renewal pending review
                        </Text>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.renewBtn}
                        onPress={() => handleRenewPress(loan)}
                      >
                        <Ionicons
                          name="refresh-outline"
                          size={15}
                          color={COLORS.primary}
                        />
                        <Text style={styles.renewBtnText}>Request Renewal</Text>
                      </Pressable>
                    )}
                  </View>
                </Card>
              );
            })
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
                      Returned:{" "}
                      {loan.returnedAt ? formatDate(loan.returnedAt) : "-"}
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

      <RenewModal
        visible={renewModal}
        loan={selectedLoan}
        onClose={() => {
          setRenewModal(false);
          setSelectedLoan(null);
        }}
        onSubmit={handleRenewSubmit}
      />
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
  collectCard: { borderColor: COLORS.accent, borderWidth: 2, backgroundColor: "#F0FBF4" },
  collectTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  collectIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "#E1F5EA",
    alignItems: "center", justifyContent: "center",
  },
  deadlinePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#FFF3D6",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, alignSelf: "flex-start",
  },
  deadlineText: { fontSize: 11, fontWeight: "700", color: COLORS.warning },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  overdueCard: { borderColor: COLORS.danger, backgroundColor: "#FFF8F8" },
  title: { fontSize: FONT.size.md, fontWeight: "700", color: COLORS.text },
  muted: { color: COLORS.textMuted, fontSize: FONT.size.sm, marginTop: 2 },
  fine: { color: COLORS.danger, fontWeight: "700", fontSize: FONT.size.sm, marginTop: 2 },
  daysLeft: { color: COLORS.danger, fontWeight: "600", fontSize: FONT.size.sm, marginTop: 2 },
  dueSoon: { color: COLORS.warning, fontWeight: "600", fontSize: FONT.size.sm, marginTop: 2 },
  renewRow: { marginTop: SPACING.sm },
  renewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
  },
  renewBtnText: {
    fontSize: FONT.size.sm,
    fontWeight: "700",
    color: COLORS.primary,
  },
  pendingRenewalPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#FFF3D6",
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  pendingRenewalText: {
    fontSize: FONT.size.sm,
    fontWeight: "600",
    color: COLORS.warning,
  },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  panel: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  bookInfo: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  bookTitle: { fontSize: FONT.size.md, fontWeight: "700", color: COLORS.text },
  bookSub: { fontSize: FONT.size.sm, color: COLORS.textMuted, marginTop: 4 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  presetRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.sm, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    minWidth: 52,
    alignItems: "center",
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: FONT.size.sm, fontWeight: "700", color: COLORS.text },
  chipTextActive: { color: COLORS.white },
  customWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  customInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    padding: 0,
  },
  customSuffix: { fontSize: FONT.size.sm, color: COLORS.textMuted, fontWeight: "600" },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  summaryText: { fontSize: FONT.size.sm, color: COLORS.primary },
  summaryBold: { fontWeight: "800" },
  note: {
    fontSize: FONT.size.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    fontStyle: "italic",
  },
  btn: {},
});