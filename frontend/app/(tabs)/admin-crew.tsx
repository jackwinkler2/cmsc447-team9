import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Pressable, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

const BRAND = "rgb(22, 13, 84)";
const IP = "130.85.251.186";

export default function AdminCrewScreen() {
  const [crew, setCrew] = useState<any[]>([]);
  const [allLocations, setAllLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // model State
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [draftAssignments, setDraftAssignments] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [crewRes, locRes] = await Promise.all([
        fetch(`http://${IP}:5000/api/crew`),
        fetch(`http://${IP}:5000/api/locations`) // admins fetch ALL locations
      ]);
      setCrew(await crewRes.json());
      setAllLocations(await locRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const openManager = (user: any) => {
    setSelectedUser(user);
    setDraftAssignments(user.assigned_location_ids || []);
  };

  const toggleLocation = (locId: number) => {
    if (draftAssignments.includes(locId)) {
      setDraftAssignments(draftAssignments.filter(id => id !== locId));
    } else {
      setDraftAssignments([...draftAssignments, locId]);
    }
  };

  const handleSaveAssignments = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://${IP}:5000/api/crew/${selectedUser.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_ids: draftAssignments })
      });
      if (res.ok) {
        setSelectedUser(null);
        fetchData(); // refresh the list
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.badge}>📍 {item.assigned_location_ids.length} Assigned Locations</Text>
      </View>
      <Pressable style={styles.manageBtn} onPress={() => openManager(item)}>
        <Text style={styles.manageBtnText}>Manage</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.headerTitle}>Crew Assignments</Text></View>
      
      {loading ? <ActivityIndicator size="large" color={BRAND} style={{ flex: 1 }} /> : (
        <FlatList
          data={crew}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      {/* assignment model */}
      <Modal visible={!!selectedUser} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Worksite Access</Text>
            <Text style={styles.modalSub}>Select where {selectedUser?.name} is allowed to log deliveries and request materials.</Text>
            
            <FlatList
              data={allLocations}
              keyExtractor={loc => loc.id.toString()}
              style={{ width: '100%', maxHeight: 400, marginTop: 10 }}
              renderItem={({ item: loc }) => (
                <View style={styles.locRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locName}>{loc.name}</Text>
                    <Text style={styles.locType}>{loc.type}</Text>
                  </View>
                  <Switch 
                    value={draftAssignments.includes(loc.id)} 
                    onValueChange={() => toggleLocation(loc.id)}
                    trackColor={{ true: BRAND, false: '#ccc' }}
                  />
                </View>
              )}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setSelectedUser(null)}><Text style={styles.cancelText}>Cancel</Text></Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSaveAssignments} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Access</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: BRAND },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 14, color: '#666', marginBottom: 8 },
  badge: { backgroundColor: '#e3f2fd', color: '#1565c0', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  manageBtn: { backgroundColor: '#e8eaf6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#c5cae9' },
  manageBtnText: { color: BRAND, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: BRAND, marginBottom: 8 },
  modalSub: { textAlign: 'center', color: '#666', marginBottom: 16 },
  locRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee', width: '100%' },
  locName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  locType: { fontSize: 13, color: '#888' },
  modalActions: { flexDirection: 'row', marginTop: 20, width: '100%', justifyContent: 'space-between' },
  cancelBtn: { padding: 16, flex: 1, alignItems: 'center' },
  cancelText: { color: '#dc3545', fontWeight: 'bold', fontSize: 16 },
  saveBtn: { padding: 16, flex: 1, backgroundColor: BRAND, borderRadius: 8, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});