import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl, Pressable, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND = "rgb(22, 13, 84)";
const IP = "130.85.251.186"; 
const API_URL = `http://${IP}:5000/api/requests`;
const API_INV = `http://${IP}:5000/api/inventory`;

export default function AdminRequestsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [warehouseOptions, setWarehouseOptions] = useState<any[]>([]);
  const [deductions, setDeductions] = useState<{ [key: number]: string }>({});

  const fetchRequests = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (response.ok) {
        // sort pending to approved to fulfilled
        const sortedData = data.sort((a: any, b: any) => {
          if (a.status === 'Pending') return -1;
          if (b.status === 'Pending') return 1;
          if (a.status === 'Approved') return -1;
          return 0;
        });
        setRequests(sortedData);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (id: number, newStatus: string, deductionsArray: any[] = []) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, deductions: deductionsArray })
      });
      if (response.ok) {
        Alert.alert("Success", `Request marked as ${newStatus}`);
        setModalVisible(false);
        fetchRequests();
      } else {
        Alert.alert("Error", "Failed to update request.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Could not connect to server.");
    }
  };

  const handleOpenFulfill = async (req: any) => {
    setSelectedReq(req);
    setDeductions({});
    
    try {
      const res = await fetch(API_INV);
      const invData = await res.json();
      
      // find all warehouses that currently have this material in stock
      const available = invData.filter((inv: any) => 
        inv.material === req.material_name && 
        inv.location_type === 'Warehouse' &&
        inv.quantity > 0
      );
      
      setWarehouseOptions(available);
      setModalVisible(true);
    } catch (e) {
      Alert.alert("Error", "Could not fetch warehouse inventory data.");
    }
  };

  // submit manual deductions
  const handleSubmitFulfillment = () => {
    const deductionsArray = Object.keys(deductions).map(invId => ({
      inventory_id: parseInt(invId),
      quantity: parseInt(deductions[parseInt(invId) as any]) || 0
    })).filter(d => d.quantity > 0);

    const totalSelected = deductionsArray.reduce((sum, d) => sum + d.quantity, 0);

    if (totalSelected === 0) return Alert.alert("Error", "You must assign at least 1 item to transfer.");
    if (totalSelected > selectedReq.quantity) return Alert.alert("Error", "You cannot transfer more than the requested amount.");

    updateStatus(selectedReq.id, 'Fulfilled', deductionsArray);
  };

  // calculate dynamic total inside the modal
  const currentTotal = Object.values(deductions).reduce((sum, val) => sum + (parseInt(val) || 0), 0);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.materialName}>{item.material_name}</Text>
        <Text style={styles.quantity}>Qty: {item.quantity}</Text>
      </View>
      <Text style={styles.detailText}>🏢 Destination: {item.jobsite}</Text>
      <Text style={styles.detailText}>👷 Requester: {item.requester}</Text>
      <Text style={styles.detailText}>📦 Total in Warehouses: {item.warehouse_stock}</Text>
      
      <View style={styles.statusRow}>
        <Text style={[
          styles.statusBadge, 
          item.status === 'Pending' ? styles.statusPending : 
          item.status === 'Approved' ? styles.statusApproved : styles.statusDisabled
        ]}>{item.status}</Text>
      </View>

      {/* dynamic action buttons based on status */}
      {item.status === 'Pending' && (
        <View style={styles.actionRow}>
          <Pressable style={[styles.actionBtn, { backgroundColor: '#d4edda' }]} onPress={() => updateStatus(item.id, 'Approved')}>
            <Text style={{ color: '#155724', fontWeight: 'bold' }}>Approve</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, { backgroundColor: '#f8d7da' }]} onPress={() => updateStatus(item.id, 'Denied')}>
            <Text style={{ color: '#721c24', fontWeight: 'bold' }}>Deny</Text>
          </Pressable>
        </View>
      )}

      {item.status === 'Approved' && (
        <Pressable style={styles.fulfillBtn} onPress={() => handleOpenFulfill(item)}>
          <Text style={styles.fulfillBtnText}>Assign Warehouse & Fulfill</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Material Requests</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={BRAND} style={styles.centered} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRequests(); }} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No requests found.</Text>}
        />
      )}

      {/* manual fulfillment modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Fulfill Request</Text>
            <Text style={styles.modalSubtitle}>Allocate {selectedReq?.quantity}x {selectedReq?.material_name}</Text>
            
            <ScrollView style={{ width: '100%', maxHeight: 300, marginVertical: 16 }}>
              {warehouseOptions.length === 0 ? (
                <Text style={styles.emptyText}>No warehouses currently have this item in stock.</Text>
              ) : (
                warehouseOptions.map((opt) => (
                  <View key={opt.id} style={styles.warehouseRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.warehouseName}>{opt.location}</Text>
                      <Text style={styles.warehouseStock}>Available: {opt.quantity}</Text>
                    </View>
                    <TextInput 
                      style={styles.modalInput}
                      placeholder="0"
                      keyboardType="numeric"
                      value={deductions[opt.id] || ''}
                      onChangeText={(val) => setDeductions({...deductions, [opt.id]: val})}
                    />
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.totalRow}>
              <Text style={styles.totalText}>Total Allocated: {currentTotal} / {selectedReq?.quantity}</Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.confirmBtn, (currentTotal === 0 || currentTotal > selectedReq?.quantity) && { opacity: 0.5 }]} 
                onPress={handleSubmitFulfillment}
              >
                <Text style={styles.confirmBtnText}>Execute Transfer</Text>
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
  header: { padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e8e8e8" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: BRAND },
  centered: { flex: 1, justifyContent: "center", alignSelf: "center" },
  emptyText: { textAlign: "center", marginTop: 20, fontSize: 15, color: "#666" },
  listContainer: { padding: 16 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#e8e8e8" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  materialName: { fontSize: 18, fontWeight: "700", color: "#333" },
  quantity: { fontSize: 18, fontWeight: "700", color: BRAND },
  detailText: { fontSize: 14, color: "#666", marginBottom: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 4, marginBottom: 12 },
  statusBadge: { fontWeight: "700", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: "hidden", fontSize: 12 },
  statusPending: { backgroundColor: "#fff3cd", color: "#856404" },
  statusApproved: { backgroundColor: "#d4edda", color: "#155724" },
  statusDisabled: { backgroundColor: "#e2e3e5", color: "#383d41" },
  
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: "center" },
  fulfillBtn: { backgroundColor: BRAND, paddingVertical: 12, borderRadius: 6, alignItems: "center" },
  fulfillBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: '90%', backgroundColor: "#fff", borderRadius: 12, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: BRAND },
  modalSubtitle: { fontSize: 14, color: "#666", marginBottom: 12 },
  
  warehouseRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  warehouseName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  warehouseStock: { fontSize: 13, color: '#666', marginTop: 4 },
  modalInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 6, width: 60, height: 40, textAlign: 'center', fontSize: 16 },
  
  totalRow: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12, marginBottom: 16, alignItems: 'flex-end' },
  totalText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { color: '#dc3545', fontWeight: 'bold', fontSize: 15 },
  confirmBtn: { backgroundColor: BRAND, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});