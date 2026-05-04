import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

function formatRole(role: string): string {
  if (role === "projectmanager") return "Project Manager";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function TabLayout() {
  const { logout, role } = useAuth();

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

  const headerRight = () => (
    <View style={{ flexDirection: "row", alignItems: "center", marginRight: 16, gap: 12 }}>
      {role && (
        <Text style={{ color: "rgb(18, 165, 50)", fontWeight: "600" }}>
          {formatRole(role)}
        </Text>
      )}
      <Pressable onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={24} color="rgb(22, 13, 84)" />
      </Pressable>
    </View>
  );

  return (
    <Tabs>
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          headerLeft: () => logo,
          headerRight: headerRight,
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
          headerRight: headerRight,
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
          headerRight: headerRight,
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
          headerRight: headerRight,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin-locations"
        options={{
          title: 'Add Location',
          tabBarIcon: ({ color }) => <Ionicons name="business" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
