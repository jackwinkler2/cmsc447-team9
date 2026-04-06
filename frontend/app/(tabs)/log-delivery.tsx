import { useRef, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

// Mock data representing what Textract would extract from a packing slip
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
  const cameraRef = useRef<CameraView>(null);

  async function handleCapture() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    if (photo) setPhotoUri(photo.uri);
  }

  function handleRetake() {
    setPhotoUri(null);
  }

  function handleSubmit() {
    // TODO: upload photo to Amazon Textract and send extracted data to backend
    Alert.alert("Delivery Logged", "Packing slip submitted successfully.");
    setPhotoUri(null);
  }

  // Permission not yet determined
  if (!permission) return <View style={styles.flex} />;

  // Permission denied
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

  // Review screen — after photo taken
  if (photoUri) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.reviewContainer}>
          <Image source={{ uri: photoUri }} style={styles.thumbnail} resizeMode="cover" />

          <Text style={styles.reviewHeading}>Extracted Data</Text>
          <Text style={styles.reviewSubtext}>Review before submitting</Text>

          <View style={styles.card}>
            <Row label="Vendor" value={MOCK_EXTRACTED.vendor} />
            <Row label="PO Number" value={MOCK_EXTRACTED.poNumber} />
            <Row label="Delivery Date" value={MOCK_EXTRACTED.deliveryDate} />
            <Row label="Job Site" value={MOCK_EXTRACTED.jobSite} />
          </View>

          <Text style={styles.sectionLabel}>Items Received</Text>
          <View style={styles.card}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableHeadText, { flex: 3 }]}>Material</Text>
              <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1, textAlign: "right" }]}>Qty</Text>
              <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1.5, textAlign: "right" }]}>Unit</Text>
            </View>
            {MOCK_EXTRACTED.items.map((item, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                <Text style={[styles.tableCell, { flex: 3 }]}>{item.material}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{item.qty}</Text>
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: "right" }]}>{item.unit}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Row label="Received By" value={MOCK_EXTRACTED.receivedBy} />
            <Row label="Notes" value={MOCK_EXTRACTED.notes} />
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.retakeButton} onPress={handleRetake}>
              <Ionicons name="camera-outline" size={18} color={BRAND} />
              <Text style={styles.retakeText}>Retake</Text>
            </Pressable>
            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Submit</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Camera screen
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing={"back" as CameraType}>
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraHint}>Point at a packing slip</Text>
            <Pressable style={styles.shutterButton} onPress={handleCapture}>
              <View style={styles.shutterInner} />
            </Pressable>
          </View>
        </CameraView>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowItem}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const BRAND = "rgb(22, 13, 84)";

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "#f5f5f5" },

  // Permission
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  permissionText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },

  // Camera
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  cameraOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 48,
    gap: 24,
  },
  cameraHint: {
    color: "#fff",
    fontSize: 15,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: "hidden",
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },

  // Review
  reviewContainer: { padding: 20 },
  thumbnail: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  reviewHeading: {
    fontSize: 24,
    fontWeight: "700",
    color: BRAND,
  },
  reviewSubtext: {
    fontSize: 13,
    color: "#888",
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  rowItem: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  rowLabel: {
    width: 110,
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
  },
  rowValue: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: BRAND,
  },
  tableHeadText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  tableCell: {
    fontSize: 14,
    color: "#333",
  },

  // Actions
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  retakeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 2,
    borderColor: BRAND,
    borderRadius: 10,
    paddingVertical: 14,
  },
  retakeText: {
    color: BRAND,
    fontSize: 16,
    fontWeight: "700",
  },
  submitButton: {
    flex: 2,
    backgroundColor: BRAND,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  button: {
    backgroundColor: BRAND,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
