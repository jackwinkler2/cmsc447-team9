import { useRef, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

// mock data
const MOCK_EXTRACTED = {
  vendor: "Atlas Building Supplies",
  poNumber: "PO-20891",
  deliveryDate: "04/06/2026",
  jobSite: "Site A – 123 Main St",
  items: [
    { material: "Concrete Mix 80lb", qty: "20", unit: "Bags" },
    { material: "Rebar #4", qty: "50", unit: "Pieces" },
    { material: "Plywood 4×8", qty: "15", unit: "Sheets" },
    { material: "PVC Pipe 4in", qty: "30", unit: "Lengths" },
  ],
  receivedBy: "J. Smith",
  notes: "All items in good condition. No visible damage.",
};

export default function LogDeliveryScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  
  // hold and edit the extracted data
  const [formData, setFormData] = useState(MOCK_EXTRACTED);
  
  const cameraRef = useRef<CameraView>(null);

  async function handleCapture() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    if (photo) {
      setPhotoUri(photo.uri);
      // resets form data to new ocr after photo is taken
      setFormData(MOCK_EXTRACTED); 
    }
  }

  function handleRetake() {
    setPhotoUri(null);
  }

  // updates form state
  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  async function handleSubmit() {
    if (!photoUri) return;

    const uploadData = new FormData();
    uploadData.append("file", {
      uri: photoUri,
      name: "packing_slip.jpg",
      type: "image/jpeg",
    } as any);
    
    // appends the edited JSON data alongside the image
    uploadData.append("ocr_data", JSON.stringify(formData));

    try {
      // change to local device ip when testing
      const response = await fetch("http://10.0.0.114:5000/api/upload", {
        method: "POST",
        body: uploadData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.ok) {
        Alert.alert("Delivery Logged", "Packing slip and data uploaded successfully.");
        setPhotoUri(null); 
      } else {
        const errorData = await response.json();
        Alert.alert("Upload Failed", errorData.error || "An error occurred");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not connect to the server.");
    }
  }

  if (!permission) return <View style={styles.flex} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={BRAND} />
          <Text style={styles.permissionText}>Camera access is required to scan packing slips.</Text>
          <Pressable style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // review & edit
  if (photoUri) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.reviewContainer}>
          <Image source={{ uri: photoUri }} style={styles.thumbnail} resizeMode="cover" />

          <Text style={styles.reviewHeading}>Extracted Data</Text>
          <Text style={styles.reviewSubtext}>Tap any field to correct OCR mistakes before submitting</Text>

          <View style={styles.card}>
            <EditableRow label="Vendor" value={formData.vendor} onChangeText={(val) => updateField("vendor", val)} />
            <EditableRow label="PO Number" value={formData.poNumber} onChangeText={(val) => updateField("poNumber", val)} />
            <EditableRow label="Delivery Date" value={formData.deliveryDate} onChangeText={(val) => updateField("deliveryDate", val)} />
            <EditableRow label="Job Site" value={formData.jobSite} onChangeText={(val) => updateField("jobSite", val)} />
          </View>

          <Text style={styles.sectionLabel}>Items Received</Text>
          <View style={styles.card}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableHeadText, { flex: 3 }]}>Material</Text>
              <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1, textAlign: "right" }]}>Qty</Text>
              <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1.5, textAlign: "right" }]}>Unit</Text>
            </View>
            {formData.items.map((item, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                <TextInput 
                  style={[styles.tableInput, { flex: 3 }]} 
                  value={item.material} 
                  onChangeText={(val) => updateItem(i, "material", val)} 
                />
                <TextInput 
                  style={[styles.tableInput, { flex: 1, textAlign: "right" }]} 
                  value={item.qty} 
                  keyboardType="numeric"
                  onChangeText={(val) => updateItem(i, "qty", val)} 
                />
                <TextInput 
                  style={[styles.tableInput, { flex: 1.5, textAlign: "right" }]} 
                  value={item.unit} 
                  onChangeText={(val) => updateItem(i, "unit", val)} 
                />
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <EditableRow label="Received By" value={formData.receivedBy} onChangeText={(val) => updateField("receivedBy", val)} />
            <EditableRow label="Notes" value={formData.notes} onChangeText={(val) => updateField("notes", val)} />
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.retakeButton} onPress={handleRetake}>
              <Ionicons name="camera-outline" size={18} color={BRAND} />
              <Text style={styles.retakeText}>Retake</Text>
            </Pressable>
            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Submit Data</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // camera
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing={"back" as CameraType} />
        <View style={[styles.cameraOverlay, { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }]}>
          <Text style={styles.cameraHint}>Point at a packing slip</Text>
          <Pressable style={styles.shutterButton} onPress={handleCapture}>
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// editable row component
function EditableRow({ label, value, onChangeText }: { label: string; value: string; onChangeText: (text: string) => void }) {
  return (
    <View style={styles.rowItem}>
      <Text style={styles.rowLabel}>{label}</Text>
      <TextInput 
        style={styles.rowInput} 
        value={value} 
        onChangeText={onChangeText}
        multiline={label === "Notes"}
      />
    </View>
  );
}

const BRAND = "rgb(22, 13, 84)";

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  permissionContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  permissionText: { fontSize: 16, color: "#555", textAlign: "center" },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: "flex-end", alignItems: "center", paddingBottom: 48, gap: 24 },
  cameraHint: { color: "#fff", fontSize: 15, backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, overflow: "hidden" },
  shutterButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.3)", borderWidth: 4, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#fff" },
  reviewContainer: { padding: 20 },
  thumbnail: { width: "100%", height: 200, borderRadius: 12, marginBottom: 20 },
  reviewHeading: { fontSize: 24, fontWeight: "700", color: BRAND },
  reviewSubtext: { fontSize: 13, color: "#888", marginBottom: 20 },
  sectionLabel: { fontSize: 15, fontWeight: "700", color: BRAND, marginBottom: 8, marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", marginBottom: 16, borderWidth: 1, borderColor: "#e8e8e8" },
  rowItem: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0", alignItems: "center" },
  rowLabel: { width: 110, fontSize: 13, fontWeight: "600", color: "#888" },
  
  rowInput: { flex: 1, fontSize: 14, color: "#333", padding: 0 },
  tableInput: { fontSize: 14, color: "#333", padding: 0, minHeight: 20 },
  
  tableHeader: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: BRAND },
  tableHeadText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  tableRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0f0f0", alignItems: "center" },
  tableRowAlt: { backgroundColor: "#fafafa" },
  tableCell: { fontSize: 14, color: "#333" },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 4, marginBottom: 16 },
  retakeButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 2, borderColor: BRAND, borderRadius: 10, paddingVertical: 14 },
  retakeText: { color: BRAND, fontSize: 16, fontWeight: "700" },
  submitButton: { flex: 2, backgroundColor: BRAND, borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  button: { backgroundColor: BRAND, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 32, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});