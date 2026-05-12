import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Image, Pressable, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

const BRAND = "rgb(22, 13, 84)";
const IP = "130.85.251.186";

export default function AdminPOsScreen() {
  const [pos, setPOs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSig, setSelectedSig] = useState<string | null>(null);

  const fetchPOs = async () => {
    try {
      const res = await fetch(`http://${IP}:5000/api/purchase-orders`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      setPOs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchPOs(); }, []));

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
            {/* checks if the user has a smart string */}
            <Text style={styles.poNumber}>{item.po_number || `PO #${item.id}`}</Text>
            <Text style={styles.statusBadge}>{item.status}</Text>
            </View>
    
        <Text style={styles.detail}>📍 Location: {item.jobsite}</Text>
        <Text style={styles.detail}>📅 Date: {item.date}</Text>

        <Pressable style={styles.viewSigBtn} onPress={() => setSelectedSig(item.signature)}>
            <Text style={styles.viewSigText}>📄 View Authorization Signature</Text>
        </Pressable>
        </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.headerTitle}>Purchase Order Hub</Text></View>
      
      {loading ? (
        <ActivityIndicator size="large" color={BRAND} style={{flex: 1}} />
      ) : (
        <FlatList
          data={pos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchPOs();}} />}
          ListEmptyComponent={<Text style={styles.empty}>No signed POs found.</Text>}
        />
      )}

      {/* signature preview modal  */}
      <Modal visible={!!selectedSig} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>PM Authorization</Text>
            <Image source={{ uri: selectedSig || '' }} style={styles.sigImage} resizeMode="contain" />
            <Pressable style={styles.closeBtn} onPress={() => setSelectedSig(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
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
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  poNumber: { fontSize: 18, fontWeight: 'bold', color: BRAND },
  statusBadge: { backgroundColor: '#d4edda', color: '#155724', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  detail: { fontSize: 14, color: '#666', marginBottom: 4 },
  viewSigBtn: { marginTop: 12, padding: 10, backgroundColor: '#e8eaf6', borderRadius: 8, alignItems: 'center' },
  viewSigText: { color: BRAND, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', padding: 20, borderRadius: 15, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  sigImage: { width: '100%', height: 200, backgroundColor: '#f9f9f9', borderRadius: 10 },
  closeBtn: { marginTop: 20, padding: 10 },
  closeBtnText: { color: BRAND, fontWeight: 'bold' }
});