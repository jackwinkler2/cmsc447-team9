import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND = "rgb(22, 13, 84)";
const API_URL = "http://130.85.241.142:5000/api/inventory"; 

export default function InventoryScreen() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Function to fetch data from the Flask backend
  const fetchInventory = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Run the fetch when the screen loads
  useEffect(() => {
    fetchInventory();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  // How each row should look
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.materialName}>{item.material}</Text>
        <Text style={styles.quantity}>Qty: {item.quantity}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.locationText}>{item.location}</Text>
        <Text style={styles.typeTag}>{item.location_type}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Inventory</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BRAND} />
        </View>
      ) : inventory.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No inventory found.</Text>
          <Text style={styles.emptySubtext}>Submit a packing slip to add items!</Text>
        </View>
      ) : (
        <FlatList
          data={inventory}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e8e8e8" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: BRAND },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, color: "#555", fontWeight: "600" },
  emptySubtext: { fontSize: 14, color: "#888", marginTop: 8 },
  listContainer: { padding: 16 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#e8e8e8", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  materialName: { fontSize: 16, fontWeight: "700", color: "#333" },
  quantity: { fontSize: 16, fontWeight: "700", color: BRAND },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  locationText: { fontSize: 14, color: "#666" },
  typeTag: { fontSize: 12, backgroundColor: "#eef2ff", color: BRAND, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: "hidden" },
});