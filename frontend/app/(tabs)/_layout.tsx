import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

export default function TabLayout() {
  const { logout } = useAuth();

  function handleSignOut() {
    logout();
    router.replace("/");
  }

  const logo = (
    <Image
      source={require("@/assets/Small_Logo.png")}
      style={{ width: 80, height: 32, marginLeft: 16 }}
      resizeMode="contain"
    />
  );

  const signOutButton = (
    <Pressable onPress={handleSignOut} style={{ marginRight: 16 }}>
      <Ionicons name="log-out-outline" size={24} color="rgb(22, 13, 84)" />
    </Pressable>
  );

  return (
    <Tabs>
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          headerLeft: () => logo,
          headerRight: () => signOutButton,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          headerLeft: () => logo,
          headerRight: () => signOutButton,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="log-delivery"
        options={{
          title: "Log Delivery",
          headerLeft: () => logo,
          headerRight: () => signOutButton,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="request"
        options={{
          title: "Request",
          headerLeft: () => logo,
          headerRight: () => signOutButton,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
