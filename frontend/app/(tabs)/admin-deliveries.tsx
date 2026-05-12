import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Pressable, Image, Modal, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

const BRAND = "rgb(22, 13, 84)";
const IP = "130.85.251.186";

export default function AdminDeliveriesScreen() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // search state
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDeliveries = async () => {
    try {
      const res = await fetch(`http://${IP}:5000/api/deliveries`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      const data = await res.json();
      setDeliveries(data);
    } catch (err) {
      console.error("Audit fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDeliveries(); }, []));

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveries();
  };

  // search logic
  const filteredDeliveries = deliveries.filter(item => 
    item.jobsite?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.crew_member?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id.toString().includes(searchQuery)
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.jobsiteText}>🏗️ {item.jobsite}</Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      <View style={styles.bodyRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.detailText}>👤 Logged by: {item.crew_member}</Text>
          <Text style={styles.idText}>Delivery ID: #{item.id}</Text>
        </View>
        {item.packing_slip_url && (
          <Pressable onPress={() => setViewingImage(item.packing_slip_url)}>
            <Image source={{ uri: item.packing_slip_url }} style={styles.receiptThumb} />
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery Audit Trail</Text>
        {/* search bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="🔍 Search by location, crew, or ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={BRAND} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredDeliveries}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No deliveries found.</Text>}
        />
      )}

      {/* image preview modal */}
      <Modal visible={!!viewingImage} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseArea} onPress={() => setViewingImage(null)} />
          <View style={styles.modalContent}>
            <Image source={{ uri: viewingImage || "" }} style={styles.fullScreenImage} resizeMode="contain" />
            <Pressable style={styles.closeButton} onPress={() => setViewingImage(null)}>
              <Text style={styles.closeButtonText}>Close View</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { padding: 20, paddingBottom: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e8e8e8" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: BRAND, marginBottom: 12 },
  
  // Search Bar
  searchBar: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 10, marginBottom: 10, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  
  listContainer: { padding: 16 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#e8e8e8" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
  jobsiteText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  dateText: { fontSize: 13, color: "#888" },
  bodyRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 14, color: "#444", marginBottom: 4 },
  idText: { fontSize: 12, color: "#aaa" },
  receiptThumb: { width: 60, height: 60, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" },
  modalCloseArea: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  modalContent: { width: '90%', alignItems: 'center' },
  fullScreenImage: { width: '100%', height: 400, borderRadius: 12, marginBottom: 20 },
  closeButton: { backgroundColor: "#fff", paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  closeButtonText: { color: "#333", fontWeight: "700", fontSize: 16 }
});