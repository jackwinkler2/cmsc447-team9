import React, { useRef, useState, useCallback } from "react";
import { StyleSheet, View, Text, Pressable, Alert, ActivityIndicator, ScrollView } from "react-native";
import SignatureScreen from "react-native-signature-canvas";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

const BRAND = "rgb(22, 13, 84)";
const IP = "130.85.251.186";

export default function PMSignaturesScreen() {
  const ref = useRef<any>();
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedJobsite, setSelectedJobsite] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetch(`http://${IP}:5000/api/locations`)
        .then(res => res.json())
        .then(data => setLocations(data.filter((l: any) => l.type === 'Jobsite')))
        .catch(err => console.error(err));
    }, [])
  );

  const handleSignature = async (signatureBase64: string) => {
    if (!selectedJobsite) return Alert.alert("Selection Required", "Please select a jobsite before signing.");
    setSubmitting(true);
    
    try {
      // upload drawn signature as an image to S3
      const uploadRes = await fetch(`http://${IP}:5000/api/upload-base64`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: signatureBase64 })
      });
      const uploadData = await uploadRes.json();
      
      // create the formal PO record
      const poRes = await fetch(`http://${IP}:5000/api/purchase-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobsite_id: selectedJobsite, signature: uploadData.photo_url })
      });
      
      if (poRes.ok) {
        Alert.alert("Authorized", "Digital Purchase Order has been securely uploaded and signed.");
        ref.current?.clearSignature();
        setSelectedJobsite(null);
      }
    } catch (e) {
      Alert.alert("System Error", "Authorization failed during upload.");
    } finally {
      setSubmitting(false);
    }
  };

  // trigger the signature read via native button
  const triggerAuthorization = () => {
    ref.current?.readSignature();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.headerTitle}>Sign Purchase Order</Text></View>
      <View style={styles.container}>
        
        <Text style={styles.label}>1. Select Authorization Target</Text>
        <View style={{ height: 60, marginBottom: 20 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {locations.map((loc) => (
                <Pressable key={loc.id} style={[styles.chip, selectedJobsite === loc.id && styles.chipActive]} onPress={() => setSelectedJobsite(loc.id)}>
                <Text style={[styles.chipText, selectedJobsite === loc.id && styles.chipTextActive]}>{loc.name}</Text>
                </Pressable>
            ))}
            </ScrollView>
        </View>

        <Text style={styles.label}>2. Signature Authorization</Text>
        <View style={styles.canvasContainer}>
          <SignatureScreen
            ref={ref}
            onOK={handleSignature}
            descriptionText="Project Manager Signature"
            webStyle={`
              .m-signature-pad--footer { display: none; margin: 0px; } 
              .m-signature-pad { box-shadow: none; border: none; }
              body,html { height: 100%; overflow: hidden; }
            `}
          />
        </View>

        <View style={styles.buttonRow}>
            <Pressable style={styles.clearBtn} onPress={() => ref.current?.clearSignature()}>
                <Text style={styles.clearBtnText}>Reset Canvas</Text>
            </Pressable>

            <Pressable style={styles.submitButton} onPress={triggerAuthorization} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Authorize & Approve</Text>}
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
  container: { padding: 16, flex: 1 },
  label: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "#e0e0e0", marginRight: 10, height: 40, justifyContent: 'center' },
  chipActive: { backgroundColor: BRAND },
  chipText: { color: "#555", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  canvasContainer: { height: 250, backgroundColor: '#fff', borderRadius: 12, padding: 4, elevation: 2, borderWidth: 1, borderColor: '#ccc' },
  buttonRow: { marginTop: 20 },
  clearBtn: { alignSelf: 'flex-end', padding: 10, marginBottom: 10 },
  clearBtnText: { color: '#d84315', fontWeight: 'bold' },
  submitButton: { backgroundColor: BRAND, paddingVertical: 16, borderRadius: 8, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "bold" }
});