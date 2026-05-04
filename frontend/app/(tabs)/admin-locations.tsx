import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND = "rgb(22, 13, 84)";
const API_URL = "http://130.85.241.142:5000/api/locations";

export default function AdminLocationsScreen() {
  const [name, setName] = useState('');
  const [type, setType] = useState('Jobsite'); 
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Information", "Please enter a location name.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim(), type }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", `${type} "${name}" was created successfully!`);
        setName(''); 
      } else {
        Alert.alert("Error", data.error || "Failed to create location.");
      }
    } catch (error) {
      console.error("Error creating location:", error);
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add New Location</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.card}>
          
          <Text style={styles.label}>Location Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., UMBC ILSB Phase 2"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Location Type</Text>
          <View style={styles.toggleContainer}>
            <Pressable
              style={[styles.toggleButton, type === 'Jobsite' && styles.toggleActive]}
              onPress={() => setType('Jobsite')}
            >
              <Text style={[styles.toggleText, type === 'Jobsite' && styles.toggleTextActive]}>Jobsite</Text>
            </Pressable>
            
            <Pressable
              style={[styles.toggleButton, type === 'Warehouse' && styles.toggleActive]}
              onPress={() => setType('Warehouse')}
            >
              <Text style={[styles.toggleText, type === 'Warehouse' && styles.toggleTextActive]}>Warehouse</Text>
            </Pressable>
          </View>

          <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Create Location</Text>
            )}
          </Pressable>
          
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e8e8e8" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: BRAND },
  container: { padding: 16 },
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 12, borderWidth: 1, borderColor: "#e8e8e8", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  label: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20, backgroundColor: "#fafafa" },
  toggleContainer: { flexDirection: "row", gap: 10, marginBottom: 24 },
  toggleButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: "#ccc", alignItems: "center", backgroundColor: "#fafafa" },
  toggleActive: { backgroundColor: BRAND, borderColor: BRAND },
  toggleText: { fontSize: 16, fontWeight: "600", color: "#666" },
  toggleTextActive: { color: "#fff" },
  submitButton: { backgroundColor: BRAND, paddingVertical: 14, borderRadius: 8, alignItems: "center", marginTop: 8 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});