import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl, Pressable, Image, ScrollView, Modal, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const BRAND = "rgb(22, 13, 84)";
const IP = "130.85.251.186";

export default function InventoryScreen() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [activeFilter, setActiveFilter] = useState('All'); 
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  // search state
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const [invRes, locRes] = await Promise.all([
        fetch(`http://${IP}:5000/api/inventory`),
        fetch(`http://${IP}:5000/api/locations`)
      ]);
      
      const invData = await invRes.json();
      const locData = await locRes.json();

      if (Array.isArray(invData)) setInventory(invData);
      else { console.error("Backend Inventory Error:", invData); setInventory([]); }

      if (Array.isArray(locData)) setLocations(locData);
      else { console.error("Backend Locations Error:", locData); setLocations([]); }

    } catch (error) {
      console.error("Network fetching error:", error);
      setInventory([]);
      setLocations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // combined filter and search logic
  const displayedInventory = inventory.filter(item => {
    const matchesLocation = activeFilter === 'All' || item.location === activeFilter;
    const matchesSearch = item.material.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLocation && matchesSearch;
  });

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Pressable onPress={() => setViewingImage(item.photo_url || "https://placehold.co/600/png?text=No+Photo")}>
          <Image source={{ uri: item.photo_url || "https://placehold.co/150/png?text=No+Photo" }} style={styles.materialImage} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <View style={styles.cardHeader}>
            <Text style={styles.materialName}>{item.material}</Text>
            <Text style={styles.quantity}>Qty: {item.quantity}</Text>
          </View>
        </View>
      </View>
      
      <Pressable style={styles.cardFooter} onPress={() => router.push(`/warehouse/${item.location_id}`)}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.locationText}>{item.location}</Text>
          <Text style={{fontSize: 12, marginLeft: 4}}>🔗</Text>
        </View>
        <Text style={[styles.typeTag, item.location_type === 'Warehouse' ? styles.warehouseTag : styles.jobsiteTag]}>
          {item.location_type}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Inventory</Text>
        
        {/* universal search bar 3 */}
        <View style={{ paddingHorizontal: 16 }}>
          <TextInput
            style={styles.searchBar}
            placeholder="🔍 Search by material name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Pressable style={[styles.filterChip, activeFilter === 'All' && styles.activeChip]} onPress={() => setActiveFilter('All')}>
            <Text style={[styles.chipText, activeFilter === 'All' && styles.activeChipText]}>All Locations</Text>
          </Pressable>
          
          {locations.map(loc => (
            <Pressable key={loc.id} style={[styles.filterChip, activeFilter === loc.name && styles.activeChip]} onPress={() => setActiveFilter(loc.name)}>
              <Text style={[styles.chipText, activeFilter === loc.name && styles.activeChipText]}>{loc.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={BRAND} style={styles.centered} />
      ) : (
        <FlatList
          data={displayedInventory}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No items found.</Text>}
        />
      )}

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
  header: { paddingTop: 16, paddingBottom: 8, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e8e8e8" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: BRAND, marginBottom: 12, paddingHorizontal: 16 },

  searchBar: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  
  filterRow: { paddingHorizontal: 16, paddingBottom: 8 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "#f0f0f0", borderWidth: 1, borderColor: "#e0e0e0", marginRight: 8 },
  activeChip: { backgroundColor: BRAND, borderColor: BRAND },
  chipText: { fontSize: 14, fontWeight: "600", color: "#555" },
  activeChipText: { color: "#fff" },

  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 16, color: "#666" },
  listContainer: { padding: 16 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#e8e8e8" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  materialName: { fontSize: 18, fontWeight: "700", color: "#333" },
  quantity: { fontSize: 18, fontWeight: "700", color: BRAND },
  materialImage: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: "#eee" },
  cardFooter: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#eee", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  locationText: { fontSize: 15, fontWeight: "600", color: "#444" },
  typeTag: { fontSize: 12, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: "hidden" },
  warehouseTag: { backgroundColor: "#e3f2fd", color: "#1565c0" },
  jobsiteTag: { backgroundColor: "#fbe9e7", color: "#d84315" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" },
  modalCloseArea: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  modalContent: { width: '90%', alignItems: 'center' },
  fullScreenImage: { width: '100%', height: 400, borderRadius: 12, marginBottom: 20 },
  closeButton: { backgroundColor: "#fff", paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  closeButtonText: { color: "#333", fontWeight: "700", fontSize: 16 }
});