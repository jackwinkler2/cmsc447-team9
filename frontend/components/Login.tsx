import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";

export default function LoginScreen() {
  const [showRoles, setShowRoles] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>MEC2</Text>
        </View>

        <Text style={styles.heading}>Welcome</Text>

        {showRoles ? (
          <View style={styles.roleContainer}>
            <TouchableOpacity style={styles.roleButton}>
              <Text style={styles.roleText}>Field Crew</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.roleButton}>
              <Text style={styles.roleText}>Driver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.roleButton}>
              <Text style={styles.roleText}>Admin</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => setShowRoles(true)}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 48,
  },
  signInButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: "70%",
    alignItems: "center",
  },
  signInText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  roleContainer: {
    width: "70%",
    gap: 16,
  },
  roleButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  roleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
