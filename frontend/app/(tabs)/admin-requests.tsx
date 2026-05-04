    import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Pressable, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND = "rgb(22, 13, 84)";
const API_URL = "http://130.85.241.142:5000/api/requests"; 

export default function AdminRequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (response.ok) {
        // Sort to show Pending requests at the top
        const sortedData = data.sort((a, b) => (a.status === 'Pending' ? -1 : 1));
        setRequests(sortedData);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        Alert.alert("Success", `Request marked as ${newStatus}`);
        fetchRequests(); // Refresh the list
      } else {
        Alert.alert("Error", "Failed to update status.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.materialName}>{item.material_name}</Text>
        <Text style={styles.quantity}>Qty: {item.quantity}</Text>
      </View>
      
      <Text style={styles.detailText}>Location: {item.jobsite}</Text>
      <Text style={styles.detailText}>Requested By: {item.requester}</Text>
      
      <View style={styles.statusRow}>
        <Text style={styles.detailText}>Status: </Text>
        <Text style={[
          styles.statusBadge, 
          item.status === 'Approved' ? styles.statusApproved : 
          item.status === 'Denied' ? styles.statusDenied : styles.statusPending
        ]}>
          {item.status}
        </Text>
      </View>

      {item.status === 'Pending' && (
        <View style={styles.actionRow}>
          <Pressable style={[styles.button, styles.denyButton]} onPress={() => updateStatus(item.id, 'Denied')}>
            <Text style={styles.buttonText}>Deny</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.approveButton]} onPress={() => updateStatus(item.id, 'Approved')}>
            <Text style={styles.buttonText}>Approve</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Requests</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={BRAND} style={styles.centered} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No requests found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e8e8e8" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: BRAND },
  centered: { flex: 1, justifyContent: "center", alignSelf: "center" },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 16, color: "#666" },
  listContainer: { padding: 16 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#e8e8e8" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  materialName: { fontSize: 18, fontWeight: "700", color: "#333" },
  quantity: { fontSize: 18, fontWeight: "700", color: BRAND },
  detailText: { fontSize: 14, color: "#666", marginBottom: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 4, marginBottom: 12 },
  statusBadge: { fontWeight: "700", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: "hidden" },
  statusPending: { backgroundColor: "#fff3cd", color: "#856404" },
  statusApproved: { backgroundColor: "#d4edda", color: "#155724" },
  statusDenied: { backgroundColor: "#f8d7da", color: "#721c24" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  button: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  denyButton: { backgroundColor: "#dc3545" },
  approveButton: { backgroundColor: "#28a745" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});