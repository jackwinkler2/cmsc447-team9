import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, ActivityIndicator, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

const BRAND = "rgb(22, 13, 84)";
const IP = "130.85.251.186"; 
const API_URL = `http://${IP}:5000/api/locations`;

export default function AdminLocationsScreen() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('Jobsite'); 
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLocations = async () => {
    try {
      const response = await fetch(API_URL);
      setLocations(await response.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  // grab gps coordinates
  const handleUseCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission to access location was denied');
      return;
    }

    setSubmitting(true);
    try {
      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
    } catch (error) {
      Alert.alert("Error", "Could not fetch GPS coordinates.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (loc: any) => {
    setEditingId(loc.id);
    setName(loc.name);
    setType(loc.type);
    setAddress(loc.address || '');
    setLatitude(loc.latitude ? loc.latitude.toString() : '');
    setLongitude(loc.longitude ? loc.longitude.toString() : '');
  };

  const handleClearForm = () => {
    setEditingId(null);
    setName('');
    setType('Jobsite');
    setAddress('');
    setLatitude('');
    setLongitude('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) return Alert.alert("Error", "Please enter a location name.");
    
    setSubmitting(true);
    
    const payload = {
      name: name.trim(),
      type,
      address: address.trim() || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null
    };

    try {
      const endpoint = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert("Success", `Location ${editingId ? 'updated' : 'created'} successfully!`);
        handleClearForm();
        fetchLocations();
      } else {
        const data = await response.json();
        Alert.alert("Error", data.error || "Operation failed.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.listItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.listName}>{item.name}</Text>
        <Text style={styles.listSubtext}>
          {item.type} {item.latitude ? `• 📍 GPS Set` : ''}
        </Text>
      </View>
      <Pressable style={styles.editButton} onPress={() => handleEdit(item)}>
        <Text style={styles.editButtonText}>Edit</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={locations}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.formContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>{editingId ? "Edit Location" : "Create Location"}</Text>
              {editingId && (
                <Pressable onPress={handleClearForm}>
                  <Text style={{color: '#dc3545', fontWeight: 'bold'}}>Cancel Edit</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.toggleContainer}>
              <Pressable style={[styles.toggleButton, type === 'Jobsite' && styles.toggleActive]} onPress={() => setType('Jobsite')}>
                <Text style={[styles.toggleText, type === 'Jobsite' && styles.toggleTextActive]}>🚧 Jobsite</Text>
              </Pressable>
              <Pressable style={[styles.toggleButton, type === 'Warehouse' && styles.toggleActive]} onPress={() => setType('Warehouse')}>
                <Text style={[styles.toggleText, type === 'Warehouse' && styles.toggleTextActive]}>🏢 Warehouse</Text>
              </Pressable>
            </View>

            <TextInput style={styles.input} placeholder="Location Name (e.g., Main Warehouse)" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Street Address (Optional)" value={address} onChangeText={setAddress} />

            <View style={styles.coordRow}>
              <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} placeholder="Latitude" keyboardType="numeric" value={latitude} onChangeText={setLatitude} />
              <TextInput style={[styles.input, {flex: 1, marginBottom: 0}]} placeholder="Longitude" keyboardType="numeric" value={longitude} onChangeText={setLongitude} />
            </View>

            <Pressable style={styles.gpsButton} onPress={handleUseCurrentLocation}>
              <Text style={styles.gpsText}>📍 Use My Current Location</Text>
            </Pressable>

            <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.submitText}>{editingId ? "Save Changes" : "Create Location"}</Text>
              )}
            </Pressable>
            
            <Text style={styles.sectionHeader}>Existing Locations</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  formContainer: { padding: 16, backgroundColor: '#fff', marginBottom: 8, borderBottomWidth: 1, borderColor: '#ddd' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: BRAND },
  
  toggleContainer: { flexDirection: "row", gap: 10, marginBottom: 16 },
  toggleButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: "#ccc", alignItems: "center", backgroundColor: "#f9f9f9" },
  toggleActive: { backgroundColor: BRAND, borderColor: BRAND },
  toggleText: { fontSize: 15, fontWeight: "600", color: "#666" },
  toggleTextActive: { color: "#fff" },

  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 12, backgroundColor: "#fafafa" },
  coordRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  
  gpsButton: { backgroundColor: '#e3f2fd', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#90caf9' },
  gpsText: { color: '#1565c0', fontWeight: '700', fontSize: 14 },
  
  submitButton: { backgroundColor: BRAND, padding: 16, borderRadius: 8, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 32, paddingBottom: 8 },
  listItem: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  listName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  listSubtext: { fontSize: 13, color: '#888', marginTop: 4 },
  editButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#e8eaf6', borderRadius: 6 },
  editButtonText: { color: BRAND, fontWeight: 'bold' }
});