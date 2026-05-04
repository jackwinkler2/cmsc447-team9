import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND = "rgb(22, 13, 84)";
const API_URL = "http://130.85.241.142:5000/api/requests"; 

export default function RequestScreen() {
  const [materialName, setMaterialName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [jobsiteId, setJobsiteId] = useState('1'); // 1 for testing
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!materialName.trim() || !quantity.trim() || !jobsiteId.trim()) {
      Alert.alert("Missing Fields", "Please fill out all fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_name: materialName.trim(),
          quantity: parseInt(quantity),
          jobsite_id: parseInt(jobsiteId)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Material request submitted!");
        setMaterialName('');
        setQuantity('');
      } else {
        Alert.alert("Error", data.error || "Failed to submit request.");
      }
    } catch (error) {
      console.error(error);
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
          <TextInput
            style={styles.input}
            placeholder="e.g., 2x4 Lumber"
            value={materialName}
            onChangeText={setMaterialName}
          />

          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 50"
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />

          <Text style={styles.label}>Jobsite ID (Leave as 1 for testing)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={jobsiteId}
            onChangeText={setJobsiteId}
          />

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
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 12, borderWidth: 1, borderColor: "#e8e8e8", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  label: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 20, backgroundColor: "#fafafa" },
  submitButton: { backgroundColor: BRAND, paddingVertical: 16, borderRadius: 8, alignItems: "center", marginTop: 8 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});