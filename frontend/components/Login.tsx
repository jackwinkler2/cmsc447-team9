import { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { useAuth, Role } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const [showRoles, setShowRoles] = useState(false);
  const { login } = useAuth();

  function handleRoleSelect(role: Role) {
    login(role);
    router.replace("/(tabs)/inventory");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image
          source={require("@/assets/MEC2 Logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.heading}>Welcome</Text>

        {showRoles ? (
          <View style={styles.roleContainer}>
            <TouchableOpacity style={styles.roleButton} onPress={() => handleRoleSelect("fieldcrew")}>
              <Text style={styles.roleText}>Field Crew</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.roleButton} onPress={() => handleRoleSelect("driver")}>
              <Text style={styles.roleText}>Driver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.roleButton} onPress={() => handleRoleSelect("admin")}>
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
    width: 200,
    height: 100,
    marginBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "rgb(22, 13, 84)",
    marginBottom: 48,
  },
  signInButton: {
    backgroundColor: "rgb(22, 13, 84)",
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
    backgroundColor: "rgb(22, 13, 84)",
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
