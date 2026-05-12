import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

const BRAND = "rgb(22, 13, 84)";
const IP = "130.85.251.186"; 
const API_MATERIALS = `http://${IP}:5000/api/materials`; 
const API_DELIVERY = `http://${IP}:5000/api/deliveries`; 
const API_UPLOAD = `http://${IP}:5000/api/upload-image`;
const API_ANALYZE = `http://${IP}:5000/api/analyze-receipt`;

const API_LOCATIONS = `http://${IP}:5000/api/locations?role=logistics`;

type DeliveryItem = { id: string; mode: 'existing' | 'new'; materialId: number | null; newName: string; newPhotoUrl: string; quantity: string; };

export default function LogDeliveryScreen() {
  const [locations, setLocations] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  const [entryMode, setEntryMode] = useState<'manual' | 'ocr'>('manual');
  const [selectedJobsite, setSelectedJobsite] = useState<number | null>(null);
  
  const [items, setItems] = useState<DeliveryItem[]>([{ id: '1', mode: 'existing', materialId: null, newName: '', newPhotoUrl: '', quantity: '' }]);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  useEffect(() => {
    Promise.all([fetch(API_LOCATIONS), fetch(API_MATERIALS)])
      .then(async ([locRes, matRes]) => { setLocations(await locRes.json()); setMaterials(await matRes.json()); })
      .finally(() => setLoadingInitial(false));
  }, []);

  const updateItem = (id: string, field: keyof DeliveryItem, value: any) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  const addItemRow = () => setItems([...items, { id: Date.now().toString(), mode: 'existing', materialId: null, newName: '', newPhotoUrl: '', quantity: '' }]);
  const removeItemRow = (id: string) => setItems(items.filter(i => i.id !== id));

  // media picker menu
  const handleMediaSelection = (isOCR: boolean) => {
    Alert.alert("Attach Document", "Choose an image source:", [
      { text: "📷 Open Camera", onPress: () => launchMedia('camera', isOCR) },
      { text: "🖼️ Photo Gallery", onPress: () => launchMedia('gallery', isOCR) },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const launchMedia = async (type: 'camera' | 'gallery', isOCR: boolean) => {
    let result;
    if (type === 'camera') {
      await ImagePicker.requestCameraPermissionsAsync();
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 });
    } else {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 });
    }

    if (!result.canceled) {
      if (isOCR) {
        processRealOCR(result.assets[0].uri);
      } else {
        setReceiptUri(result.assets[0].uri);
      }
    }
  };

  // process ocr
  const processRealOCR = async (uri: string) => {
    setOcrProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri, name: 'scan.jpg', type: 'image/jpeg' } as any);
      const response = await fetch(API_ANALYZE, { method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data' }});
      if (!response.ok) throw new Error("Failed to analyze.");
      
      const data = await response.json();
      setReceiptUri(data.receipt_url);
      
      if (data.extracted_items && data.extracted_items.length > 0) {
        setItems(data.extracted_items.map((item: any, i: number) => ({
          id: Date.now().toString() + i, mode: 'existing', materialId: item.material_id, newName: '', newPhotoUrl: '', quantity: item.quantity.toString()
        })));
        Alert.alert("Scan Complete", `Found ${data.extracted_items.length} matching materials.`);
      } else {
        Alert.alert("No Matches", "Could not match text to catalog.");
      }
      setEntryMode('manual'); 
    } catch (e) {
      Alert.alert("Scan Failed", "Could not process the document.");
    } finally {
      setOcrProcessing(false);
    }
  };

  const handleSubmitManual = async () => {
    if (!selectedJobsite) return Alert.alert("Missing", "Select a jobsite.");
    setSubmitting(true);
    try {
      let finalReceiptUrl = receiptUri;
      if (receiptUri && !receiptUri.startsWith('http')) {
        const formData = new FormData();
        formData.append('file', { uri: receiptUri, name: 'receipt.jpg', type: 'image/jpeg' } as any);
        const uploadRes = await fetch(API_UPLOAD, { method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data' }});
        if (uploadRes.ok) finalReceiptUrl = (await uploadRes.json()).photo_url;
      }

      const payloadItems = [];
      for (const item of items) {
        let matId = item.materialId;
        if (item.mode === 'new') {
          const matRes = await fetch(API_MATERIALS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: item.newName, photo_url: item.newPhotoUrl })});
          matId = (await matRes.json()).id; 
        }
        payloadItems.push({ material_id: matId, quantity: parseInt(item.quantity) });
      }

      await fetch(API_DELIVERY, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobsite_id: selectedJobsite, packing_slip_url: finalReceiptUrl, items: payloadItems }) });
      Alert.alert("Success", "Delivery logged!");
      setItems([{ id: '1', mode: 'existing', materialId: null, newName: '', newPhotoUrl: '', quantity: '' }]);
      setReceiptUri(null); 
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) return <ActivityIndicator size="large" color={BRAND} style={{flex: 1, justifyContent: "center"}} />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}><Text style={styles.headerTitle}>Intake Delivery</Text></View>

        <View style={styles.toggleContainer}>
          <Pressable style={[styles.toggleButton, entryMode === 'manual' && styles.toggleActive]} onPress={() => setEntryMode('manual')}><Text style={[styles.toggleText, entryMode === 'manual' && styles.toggleTextActive]}>Manual Entry</Text></Pressable>
          <Pressable style={[styles.toggleButton, entryMode === 'ocr' && styles.toggleActive]} onPress={() => setEntryMode('ocr')}><Text style={[styles.toggleText, entryMode === 'ocr' && styles.toggleTextActive]}>Smart OCR Scan</Text></Pressable>
        </View>

        {entryMode === 'manual' && (
          <View style={styles.card}>
            <Text style={styles.label}>1. Destination</Text>
            
            {/* if no assigned locations */}
            {locations.length === 0 ? (
              <Text style={{ color: '#d84315', marginBottom: 24, fontStyle: 'italic' }}>
                You have not been assigned to any destinations. Please contact your Project Manager.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {locations.map((loc) => (
                  <Pressable key={loc.id} style={[styles.chip, selectedJobsite === loc.id && styles.chipActive]} onPress={() => setSelectedJobsite(loc.id)}>
                    <Text style={[styles.chipText, selectedJobsite === loc.id && styles.chipTextActive]}>{loc.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            <Text style={styles.label}>2. Materials Delivered</Text>
            {items.map((item, index) => (
              <View key={item.id} style={styles.lineItemBox}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemHeaderText}>Item #{index + 1}</Text>
                  {items.length > 1 && <Pressable onPress={() => removeItemRow(item.id)}><Text style={styles.removeText}>Remove</Text></Pressable>}
                </View>

                <View style={styles.materialHeaderRow}>
                  <View style={styles.smallToggle}>
                    <Pressable onPress={() => updateItem(item.id, 'mode', 'existing')}><Text style={[styles.smallToggleText, item.mode === 'existing' && styles.smallToggleActive]}>Existing</Text></Pressable>
                    <Text style={{color: '#ccc', marginHorizontal: 8}}>|</Text>
                    <Pressable onPress={() => updateItem(item.id, 'mode', 'new')}><Text style={[styles.smallToggleText, item.mode === 'new' && styles.smallToggleActive]}>+ Add New</Text></Pressable>
                  </View>
                </View>

                {item.mode === 'existing' ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    {materials.map((mat) => (
                      <Pressable key={mat.id} style={[styles.smallChip, item.materialId === mat.id && styles.chipActive]} onPress={() => updateItem(item.id, 'materialId', mat.id)}>
                        <Text style={[styles.smallChipText, item.materialId === mat.id && styles.chipTextActive]}>{mat.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.newMaterialBox}>
                    <TextInput style={styles.input} placeholder="Material Name" value={item.newName} onChangeText={(v) => updateItem(item.id, 'newName', v)} />
                  </View>
                )}
                <TextInput style={styles.input} placeholder="Quantity" keyboardType="numeric" value={item.quantity} onChangeText={(v) => updateItem(item.id, 'quantity', v)} />
              </View>
            ))}

            <Pressable style={styles.addAnotherButton} onPress={addItemRow}><Text style={styles.addAnotherText}>+ Add Another Material</Text></Pressable>

            <Text style={styles.label}>3. Packing Slip (Optional)</Text>
            <View style={styles.photoRow}>
              <Pressable style={styles.cameraButton} onPress={() => handleMediaSelection(false)}>
                <Text style={styles.cameraText}>🖼️ {receiptUri ? "Change Image" : "Attach Receipt"}</Text>
              </Pressable>
              {receiptUri && <Image source={{ uri: receiptUri }} style={styles.previewImage} />}
            </View>

            <Pressable style={styles.submitButton} onPress={handleSubmitManual} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Delivery</Text>}
            </Pressable>
          </View>
        )}

        {entryMode === 'ocr' && (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            {ocrProcessing ? (
              <View style={{ alignItems: 'center' }}>
                <ActivityIndicator size="large" color={BRAND} />
                <Text style={styles.ocrTitle}>Analyzing Document...</Text>
                <Text style={styles.ocrSubtext}>Sending secure scan to AWS Textract AI...</Text>
              </View>
            ) : (
              <>
                <View style={styles.ocrIconPlaceholder}><Text style={{ fontSize: 40 }}>📄</Text></View>
                <Text style={styles.ocrTitle}>Auto-Scan Packing Slip</Text>
                <Text style={styles.ocrSubtext}>Upload a photo of the vendor receipt to extract materials automatically.</Text>
                <Pressable style={styles.ocrButton} onPress={() => handleMediaSelection(true)}>
                  <Text style={styles.submitText}>🖼️ Upload Image</Text>
                </Pressable>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { padding: 16 },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: BRAND },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#e0e0e0', borderRadius: 8, padding: 4, marginBottom: 16 },
  toggleButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  toggleActive: { backgroundColor: '#fff', elevation: 2 },
  toggleText: { fontSize: 15, fontWeight: '600', color: '#666' },
  toggleTextActive: { color: BRAND },
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 12, borderWidth: 1, borderColor: "#e8e8e8" },
  label: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 12 },
  lineItemBox: { backgroundColor: '#fdfdfd', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 16 },
  itemHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
  itemHeaderText: { fontWeight: '700', color: BRAND },
  removeText: { color: '#dc3545', fontWeight: '600', fontSize: 13 },
  addAnotherButton: { backgroundColor: '#e8eaf6', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#c5cae9', borderStyle: 'dashed' },
  addAnotherText: { color: BRAND, fontWeight: '700' },
  materialHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  smallToggle: { flexDirection: 'row', alignItems: 'center' },
  smallToggleText: { fontSize: 13, fontWeight: '600', color: '#888' },
  smallToggleActive: { color: BRAND, textDecorationLine: 'underline' },
  newMaterialBox: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 12, backgroundColor: "#fff" },
  chipScroll: { marginBottom: 16, paddingBottom: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "#eee", marginRight: 10, borderWidth: 1, borderColor: "#ddd" },
  smallChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: "#eee", marginRight: 8, borderWidth: 1, borderColor: "#ddd" },
  chipActive: { backgroundColor: BRAND, borderColor: BRAND },
  chipText: { color: "#555", fontWeight: "600" },
  smallChipText: { color: "#555", fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: "#fff" },
  photoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  cameraButton: { flex: 1, backgroundColor: "#f0f0f0", padding: 14, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#ddd" },
  cameraText: { color: '#444', fontWeight: "600", fontSize: 14 },
  previewImage: { width: 50, height: 50, borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  submitButton: { backgroundColor: BRAND, paddingVertical: 16, borderRadius: 8, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  ocrIconPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  ocrTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 12 },
  ocrSubtext: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 20, marginBottom: 24, lineHeight: 20 },
  ocrButton: { backgroundColor: '#1565c0', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 8, alignItems: "center", width: '100%' }
});