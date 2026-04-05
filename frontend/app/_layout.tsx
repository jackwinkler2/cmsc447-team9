import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="warehouse/[id]" options={{ title: "Warehouse" }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </AuthProvider>
  );
}
