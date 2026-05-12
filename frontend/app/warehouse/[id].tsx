import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BRAND = "rgb(22, 13, 84)";
const IP = "10.0.0.114"; 

export default function LocationInventoryScreen() {
  // expo Router hook to grab the ID from the URL
  const { id } = useLocalSearchParams(); 
  
  const [locationName, setLocationName] = useState("Loading...");
  const [locationType, setLocationType] = useState("");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const response = await fetch(`http://${IP}:5000/api/locations/${id}/inventory`);
        if (response.ok) {
          const data = await response.json();
          setLocationName(data.location_name);
          setLocationType(data.location_type);
          setInventory(data.inventory);
        }
      } catch (error) {
        console.error("Error fetching location inventory:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationData();
  }, [id]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.materialName}>{item.material}</Text>
      <Text style={styles.quantity}>Qty: {item.quantity}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={BRAND} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{locationName}</Text>
          {locationType ? <Text style={styles.headerSubtitle}>{locationType}</Text> : null}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={BRAND} style={styles.centered} />
      ) : (
        <FlatList
          data={inventory}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No materials currently at this location.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e8e8e8" },
  backButton: { paddingRight: 16 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: BRAND },
  headerSubtitle: { fontSize: 14, color: "#666", marginTop: 2 },
  centered: { flex: 1, justifyContent: "center", alignSelf: "center" },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 16, color: "#666" },
  listContainer: { padding: 16 },
  card: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#e8e8e8" },
  materialName: { fontSize: 18, fontWeight: "600", color: "#333" },
  quantity: { fontSize: 18, fontWeight: "700", color: BRAND },
});