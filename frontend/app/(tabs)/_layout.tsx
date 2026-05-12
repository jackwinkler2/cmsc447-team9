import { useState, useEffect } from 'react';
import { Tabs, router } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext'; 
import { View, Image, Pressable, Alert, Text, StyleSheet } from 'react-native';
import * as Network from 'expo-network'; // --- NEW IMPORT ---

const BRAND = "rgb(22, 13, 84)";

export default function TabLayout() {
  const { role, logout } = useAuth();
  const [isViewingAsLogistics, setIsViewingAsLogistics] = useState(false);
  
  // network state-
  const [isConnected, setIsConnected] = useState(true);

  const actualIsAdminOrPM = role === 'admin' || role === 'projectmanager';
  const isAdminOrPM = actualIsAdminOrPM && !isViewingAsLogistics;
  const isLogistics = role === 'logistics' || (actualIsAdminOrPM && isViewingAsLogistics);

  // network change
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        // if it returns false, they are offline
        setIsConnected(networkState.isConnected ?? true);
      } catch (e) {
        // fallback to true if the check fails
        setIsConnected(true);
      }
    };

    // check immediately on load
    checkNetwork();

    // check every 3 seconds
    const interval = setInterval(checkNetwork, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Log Out", 
        style: "destructive", 
        onPress: () => {
          logout(); 
          router.replace('/'); 
        } 
      }
    ]);
  };

  const toggleViewMode = () => {
    const newMode = !isViewingAsLogistics;
    setIsViewingAsLogistics(newMode);
    
    if (newMode) {
      router.replace('/log-delivery');
    } else {
      router.replace('/admin-requests');
    }
  };

  return (
    <>
      {/* offline header */}
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={18} color="#fff" />
          <Text style={styles.offlineText}>
            NO Internet Connection. Data may not be synced.
          </Text>
        </View>
      )}

      <Tabs screenOptions={{ 
        tabBarActiveTintColor: BRAND,
        headerShown: true,
        headerTitleAlign: 'center',
        
        // view switcher
        headerLeft: () => (
          <View style={{ marginLeft: 15 }}>
            {actualIsAdminOrPM && (
              <Pressable 
                onPress={toggleViewMode}
                style={{
                  backgroundColor: isViewingAsLogistics ? '#e3f2fd' : '#e8eaf6',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: isViewingAsLogistics ? '#90caf9' : '#c5cae9'
                }}
              >
                <Text style={{ color: BRAND, fontWeight: '700', fontSize: 12 }}>
                  {isViewingAsLogistics ? "Crew View" : "Admin View"}
                </Text>
              </Pressable>
            )}
          </View>
        ),

        // logo
        headerTitle: () => (
          <Image 
            source={require('../../assets/Small_Logo.png')} 
            style={{ width: 120, height: 40, resizeMode: 'contain' }} 
          />
        ),
        
        // logout
        headerRight: () => (
          <View style={{ marginRight: 15 }}>
            <Pressable onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={28} color={BRAND} />
            </Pressable>
          </View>
        ),
      }}>
        
        {/* universal tabs*/}
        <Tabs.Screen
          name="inventory"
          options={{
            title: 'Live Inventory',
            tabBarIcon: ({ color }) => <Ionicons name="layers-outline" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ color }) => <Ionicons name="map-outline" size={24} color={color} />,
          }}
        />

        {/* logistics tabs */}
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

        {/* admin & pm tabs */}
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
        <Tabs.Screen
          name="admin-materials"
          options={{
            title: 'Catalog',
            tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={24} color={color} />,
            href: isAdminOrPM ? '/admin-materials' : null,
          }}
        />
        <Tabs.Screen
          name="admin-deliveries"
          options={{
            title: 'Audit Trail',
            tabBarIcon: ({ color }) => <Ionicons name="receipt-outline" size={24} color={color} />,
            href: isAdminOrPM ? '/admin-deliveries' : null,
          }}
        />
        <Tabs.Screen
          name="pm-signatures"
          options={{
            title: 'Sign PO',
            tabBarIcon: ({ color }) => <Ionicons name="create-outline" size={24} color={color} />,
            href: isAdminOrPM ? '/pm-signatures' : null,
          }}
        />
        <Tabs.Screen
          name="admin-pos"
          options={{
            title: 'PO Hub',
            tabBarIcon: ({ color }) => <Ionicons name="folder-open-outline" size={24} color={color} />,
            href: isAdminOrPM ? '/admin-pos' : null,
          }}
        />
        <Tabs.Screen
          name="admin-crew"
          options={{
            title: 'Manage Crew',
            tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={24} color={color} />,
            href: isAdminOrPM ? '/admin-crew' : null,
          }}
        />

      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#d32f2f', // standard error red
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  offlineText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 8,
  }
});