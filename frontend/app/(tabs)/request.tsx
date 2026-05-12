import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND = "rgb(22, 13, 84)";
const IP = "130.85.251.186";
const API_URL_REQUESTS = `http://${IP}:5000/api/requests`; 

const API_URL_LOCATIONS = `http://${IP}:5000/api/locations?role=logistics`;

export default function RequestScreen() {
  const [materialName, setMaterialName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [jobsiteId, setJobsiteId] = useState<number | null>(null);
  
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // fetch dynamic locations on screen load
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(API_URL_LOCATIONS);
        const data = await response.json();
        // filter out warehouses, field crews only request to jobsites
        setLocations(data.filter((loc: any) => loc.type === 'Jobsite'));
      } catch (error) {
        console.error("Failed to fetch locations", error);
      }
    };
    fetchLocations();
  }, []);

  const handleSubmit = async () => {
    if (!materialName.trim() || !quantity.trim() || !jobsiteId) {
      Alert.alert("Missing Fields", "Please select a jobsite and fill out all fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL_REQUESTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_name: materialName.trim(),
          quantity: parseInt(quantity),
          jobsite_id: jobsiteId
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Material request submitted!");
        setMaterialName('');
        setQuantity('');
        setJobsiteId(null);
      } else {
        const data = await response.json();
        Alert.alert("Error", data.error || "Failed to submit request.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Request Materials</Text>
          <Text style={styles.headerSubtext}>Submit a request to the warehouse</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Material Name</Text>
          <TextInput style={styles.input} placeholder="e.g., 2x4 Lumber" value={materialName} onChangeText={setMaterialName} />

          <Text style={styles.label}>Quantity</Text>
          <TextInput style={styles.input} placeholder="e.g., 50" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />

          <Text style={styles.label}>Select Jobsite</Text>
          
          {locations.length === 0 ? (
             <Text style={{ color: '#d84315', marginBottom: 24, fontStyle: 'italic' }}>
               You have not been assigned to any jobsites. Please contact your Project Manager.
             </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {locations.map((loc) => (
                <Pressable 
                  key={loc.id} 
                  style={[styles.chip, jobsiteId === loc.id && styles.chipActive]}
                  onPress={() => setJobsiteId(loc.id)}
                >
                  <Text style={[styles.chipText, jobsiteId === loc.id && styles.chipTextActive]}>{loc.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Request</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { padding: 16 },
  header: { marginBottom: 20, paddingHorizontal: 4 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: BRAND },
  headerSubtext: { fontSize: 14, color: "#666", marginTop: 4 },
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 12, borderWidth: 1, borderColor: "#e8e8e8" },
  label: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 20, backgroundColor: "#fafafa" },
  chipScroll: { marginBottom: 24 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "#eee", marginRight: 10, borderWidth: 1, borderColor: "#ddd" },
  chipActive: { backgroundColor: BRAND, borderColor: BRAND },
  chipText: { color: "#555", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  submitButton: { backgroundColor: BRAND, paddingVertical: 16, borderRadius: 8, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});