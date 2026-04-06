import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RequestScreen() {
  const [materialType, setMaterialType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit() {
    if (!materialType.trim() || !quantity.trim()) {
      Alert.alert("Missing fields", "Material Type and Quantity are required.");
      return;
    }
    // TODO: send to backend
    Alert.alert("Request Submitted", `${materialType} × ${quantity}`);
    setMaterialType("");
    setQuantity("");
    setNotes("");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Material Request</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Material Type</Text>
            <TextInput
              style={styles.input}
              value={materialType}
              onChangeText={setMaterialType}
              placeholder="e.g. Concrete"
              placeholderTextColor="#aaa"
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Material Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="e.g. 50"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes"
              placeholderTextColor="#aaa"
              multiline
            />
          </View>

          <Pressable style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Submit</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const BRAND = "rgb(22, 13, 84)";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: BRAND,
    marginBottom: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  label: {
    width: 140,
    fontSize: 15,
    fontWeight: "600",
    color: BRAND,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  notesInput: {
    height: 88,
    textAlignVertical: "top",
  },
  button: {
    marginTop: 12,
    backgroundColor: BRAND,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
