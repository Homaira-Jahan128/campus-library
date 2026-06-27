import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
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
import { LoanRequest, RequestStatus } from "@/types";
import {
  getRequestsByLibrary,
  updateRequestStatus,
  expireUncollectedRequests,
} from "@/services/requestService";
import { adjustAvailableCopies, getBookById } from "@/services/bookService";
import { createLoan } from "@/services/loanService";
import { createNotification } from "@/services/notificationService";
import { formatDate } from "@/utils/fines";

type FilterType = RequestStatus | "all";

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "To Collect", value: "approved_pending_collection" },
  { label: "Collected", value: "collected" },
  { label: "Rejected", value: "rejected" },
  { label: "Expired", value: "expired" },
];

function getStatusBadge(status: RequestStatus) {
  switch (status) {
    case "pending": return <Badge status="pending" label="PENDING" />;
    case "approved_pending_collection": return <Badge status="approved" label="COLLECT" />;
    case "collected": return <Badge status="active" label="COLLECTED" />;
    case "rejected": return <Badge status="rejected" label="REJECTED" />;
    case "expired": return <Badge status="disabled" label="EXPIRED" />;
    default: return null;
  }
}

function getTimeLeft(deadline?: number): string {
  if (!deadline) return "";
  const diff = deadline - Date.now();
  if (diff <= 0) return "Collection time expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

// Student info display — roll + department
function StudentInfo({ req }: { req: LoanRequest }) {
  return (
    <View style={styles.studentCard}>
      <View style={styles.studentRow}>
        <Ionicons name="card-outline" size={13} color={COLORS.primary} />
        <Text style={styles.studentRoll}>
          {req.userRoll ?? req.userId.slice(0, 8).toUpperCase()}
        </Text>
      </View>
      {req.userDepartment && (
        <View style={styles.studentRow}>
          <Ionicons name="business-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.studentDept} numberOfLines={1}>
            {req.userDepartment}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function LibrarianRequests() {
  const { appUser } = useAuth();
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    if (!appUser?.libraryId) return;
    await expireUncollectedRequests();
    const data = await getRequestsByLibrary(appUser.libraryId);
    setRequests(data);
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [appUser?.libraryId]);

  const filtered = useMemo(() => {
    let result = filter === "all"
      ? requests
      : requests.filter((r) => r.status === filter);

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter((r) => {
        const roll = (r.userRoll ?? "").toLowerCase();
        const dept = (r.userDepartment ?? "").toLowerCase();
        const book = r.bookTitle.toLowerCase();
        const uid = r.userId.toLowerCase();
        return roll.includes(q) || dept.includes(q) || book.includes(q) || uid.includes(q);
      });
    }
    return result;
  }, [requests, filter, searchText]);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const toCollectCount = requests.filter(
    (r) => r.status === "approved_pending_collection"
  ).length;

  const handleApprove = async (req: LoanRequest) => {
    setProcessingId(req.id);
    try {
      const book = await getBookById(req.bookId);
      if (!book || book.availableCopies <= 0) {
        Alert.alert("Unavailable", "No copies available.");
        return;
      }
      const approvedAt = Date.now();
      const collectionDeadline = approvedAt + 24 * 60 * 60 * 1000;
      await updateRequestStatus(req.id, "approved_pending_collection", {
        approvedAt,
        collectionDeadline,
      });
      await createNotification(
        req.userId,
        "Request Approved ✓",
        `Your request for "${req.bookTitle}" is approved! Collect from ${req.libraryName} within 24 hours.`,
        "request_approved"
      );
      await load();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not approve");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCollected = async (req: LoanRequest) => {
    Alert.alert(
      "Confirm Collection",
      `Confirm "${req.bookTitle}" collected?\n\nRoll: ${req.userRoll ?? "N/A"}\nDept: ${req.userDepartment ?? "N/A"}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm ✓",
          onPress: async () => {
            setProcessingId(req.id);
            try {
              await adjustAvailableCopies(req.bookId, -1);
              await createLoan({
                bookId: req.bookId,
                bookTitle: req.bookTitle,
                userId: req.userId,
                userName: req.userName,
                userRoll: req.userRoll,
                userDepartment: req.userDepartment,
                libraryId: req.libraryId,
                libraryName: req.libraryName,
                loanDurationDays: req.loanDurationDays,
              });
              await updateRequestStatus(req.id, "collected", {
                collectedAt: Date.now(),
              });
              await createNotification(
                req.userId,
                "Book Collected 📚",
                `"${req.bookTitle}" checked out for ${req.loanDurationDays} days. Happy reading!`,
                "request_approved"
              );
              await load();
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "Could not process");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (req: LoanRequest) => {
    Alert.alert("Reject Request", `Reject "${req.bookTitle}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          setProcessingId(req.id);
          try {
            await updateRequestStatus(req.id, "rejected");
            await createNotification(
              req.userId,
              "Request Rejected",
              `Your request for "${req.bookTitle}" was not approved.`,
              "request_rejected"
            );
            await load();
          } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Could not reject");
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Borrow Requests"
        subtitle={
          pendingCount > 0
            ? `${pendingCount} pending · ${toCollectCount} to collect`
            : toCollectCount > 0
              ? `${toCollectCount} waiting for collection`
              : "All requests handled"
        }
      />

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by roll no. or book title..."
            placeholderTextColor={COLORS.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
            keyboardType="default"
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText("")} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={styles.filterRow}
        keyboardShouldPersistTaps="handled"
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setFilter(f.value)}
            style={[styles.chip, filter === f.value && styles.chipActive]}
          >
            <Text
              style={[styles.chipText, filter === f.value && styles.chipTextActive]}
              numberOfLines={1}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

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
              <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>
                {searchText ? "No matching requests." : "No requests found."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[
              styles.card,
              item.status === "approved_pending_collection" && styles.cardHighlight,
            ]}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookTitle}>{item.bookTitle}</Text>
                  <Text style={styles.muted}>
                    {item.loanDurationDays} days · {formatDate(item.requestedAt)}
                  </Text>

                  {/* Student info — roll + department */}


                  {item.status === "approved_pending_collection" && item.collectionDeadline && (
                    <View style={styles.deadlinePill}>
                      <Ionicons name="time-outline" size={12} color={COLORS.warning} />
                      <Text style={styles.deadlineText}>
                        {getTimeLeft(item.collectionDeadline)}
                      </Text>
                    </View>
                  )}

                </View>
                {getStatusBadge(item.status)}
              </View>
              <StudentInfo req={item} />
              {item.status === "collected" && item.collectedAt && (
                <Text style={styles.collectedAt}>
                  Collected: {formatDate(item.collectedAt)}
                </Text>
              )}

              {item.status === "pending" && (
                <View style={styles.actionsRow}>
                  <Button
                    title="Approve"
                    onPress={() => handleApprove(item)}
                    variant="secondary"
                    loading={processingId === item.id}
                    style={styles.actionBtn}
                  />
                  <Button
                    title="Reject"
                    onPress={() => handleReject(item)}
                    variant="danger"
                    loading={processingId === item.id}
                    style={styles.actionBtn}
                  />
                </View>
              )}

              {item.status === "approved_pending_collection" && (
                <Button
                  title="Mark as Collected ✓"
                  onPress={() => handleCollected(item)}
                  variant="secondary"
                  loading={processingId === item.id}
                  style={styles.collectBtn}
                />
              )}
            </View>
          )}
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
  filterList: {
  flexGrow: 0,
  flexShrink: 0,
},
filterRow: {
  flexDirection: "row",
  paddingHorizontal: SPACING.lg,
  paddingBottom: SPACING.sm,
  gap: SPACING.sm,
  alignItems: "center",
},
chip: {
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: COLORS.border,
  backgroundColor: COLORS.card,
  minWidth: 60,
  alignItems: "center",
  justifyContent: "center",
},
chipText: {
  color: COLORS.text,
  fontSize: FONT.size.sm,
  fontWeight: "600",
  textAlign: "center",
},
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  
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
  cardHighlight: { borderColor: COLORS.accent, backgroundColor: "#F0FBF4" },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bookTitle: { fontSize: FONT.size.md, fontWeight: "700", color: COLORS.text },
  muted: { color: COLORS.textMuted, fontSize: FONT.size.sm, marginTop: 2 },

  // Student info card
  studentCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
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

  deadlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    backgroundColor: "#FFF3D6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  deadlineText: { fontSize: 11, fontWeight: "700", color: COLORS.warning },
  collectedAt: { fontSize: 11, color: COLORS.accent, fontWeight: "600", marginTop: 4 },
  actionsRow: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
  actionBtn: { flex: 1 },
  collectBtn: { marginTop: SPACING.md },
});