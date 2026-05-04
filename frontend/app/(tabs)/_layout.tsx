import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext'; 

const BRAND = "rgb(22, 13, 84)";

export default function TabLayout() {
  const { role } = useAuth();

  // maps tab visibility to roles
  const isAdminOrPM = role === 'admin' || role === 'projectmanager';
  const isLogistics = role === 'logistics';

  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: BRAND,
      headerShown: true
    }}>
      
      {/* VISIBLE TO EVERYONE */}
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color }) => <Ionicons name="cube-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <Ionicons name="map-outline" size={24} color={color} />,
        }}
      />

      {/* LOGISTICS ONLY TABS */}
      <Tabs.Screen
        name="log-delivery"
        options={{
          title: 'Log Delivery',
          tabBarIcon: ({ color }) => <Ionicons name="camera-outline" size={24} color={color} />,
          href: isLogistics ? '/log-delivery' : null,
        }}
      />
      <Tabs.Screen
        name="request"
        options={{
          title: 'Request',
          tabBarIcon: ({ color }) => <Ionicons name="construct-outline" size={24} color={color} />,
          href: isLogistics ? '/request' : null,
        }}
      />

      {/* ADMIN & PM ONLY TABS */}
      <Tabs.Screen
        name="admin-locations"
        options={{
          title: 'Add Location',
          tabBarIcon: ({ color }) => <Ionicons name="business-outline" size={24} color={color} />,
          href: isAdminOrPM ? '/admin-locations' : null,
        }}
      />
      <Tabs.Screen
        name="admin-requests"
        options={{
          title: 'Review Requests',
          tabBarIcon: ({ color }) => <Ionicons name="clipboard-outline" size={24} color={color} />,
          href: isAdminOrPM ? '/admin-requests' : null,
        }}
      />

    </Tabs>
  );
}