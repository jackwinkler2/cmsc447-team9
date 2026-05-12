import { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, Role } from "@/contexts/AuthContext";

// mock users
const MOCK_USERS = {
  "logistics": { password: "password123", role: "logistics" as Role },
  "pm": { password: "password123", role: "projectmanager" as Role },
  "admin": { password: "password123", role: "admin" as Role },
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  function handleLogin() {
    // clean up the input text
    const sanitizedEmail = email.trim().toLowerCase();
    
    // look up the user in our mock database
    const user = MOCK_USERS[sanitizedEmail as keyof typeof MOCK_USERS];

    // check if user exists and password matches
    if (user && user.password === password) {
      login(user.role);
      router.replace("/(tabs)/inventory");
    } else {
      Alert.alert("Login Failed", "Invalid email or password. Please try again.");
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Image
          source={require("@/assets/MEC2 Logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.heading}>Sign In</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="name"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
            <Text style={styles.signInText}>Log In</Text>
          </TouchableOpacity>
          
          <View style={styles.mockHelpBox}>
            <Text style={styles.mockHelpTitle}>Mock Accounts (PW: password123):</Text>
            <Text style={styles.mockHelpText}>• logistics</Text>
            <Text style={styles.mockHelpText}>• pm</Text>
            <Text style={styles.mockHelpText}>• admin</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 220,
    height: 100,
    marginBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "rgb(22, 13, 84)",
    marginBottom: 32,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  signInButton: {
    backgroundColor: "rgb(22, 13, 84)",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  signInText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  mockHelpBox: {
    marginTop: 24,
    padding: 12,
    backgroundColor: "#e8eaf6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c5cae9"
  },
  mockHelpTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgb(22, 13, 84)",
    marginBottom: 6
  },
  mockHelpText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 2
  }
});