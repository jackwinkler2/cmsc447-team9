import { useEffect, useRef, useState, useCallback } from "react";
import { Pressable, StyleSheet, View, Text } from "react-native";
import MapView, { Marker, Callout, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router"; 

// fallback center: UMBC / Baltimore area
const DEFAULT_REGION: Region = {
  latitude: 39.2557,
  longitude: -76.7103,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const BRAND = "rgb(22, 13, 84)";
const IP = "130.85.251.186";

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [apiLocations, setApiLocations] = useState<any[]>([]);
  // fetch locations each time tab is opened
  useFocusEffect(
    useCallback(() => {
      const fetchLocations = async () => {
        try {
          const response = await fetch(`http://${IP}:5000/api/locations`);
          const data = await response.json();
          setApiLocations(data);
        } catch (error) {
          console.error("Failed to fetch map locations", error);
        }
      };
      
      fetchLocations();
    }, [])
  );

  // fetch device gps
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const userRegion: Region = {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setUserLocation({ latitude, longitude });
      mapRef.current?.animateToRegion(userRegion, 500);
    })();
  }, []);

  function handleRecenter() {
    const target = userLocation
      ? { ...userLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }
      : DEFAULT_REGION;
    mapRef.current?.animateToRegion(target, 500);
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* render markers for every location that has coordinates */}
        {apiLocations.map((loc) => {
          if (!loc.latitude || !loc.longitude) return null;
          
          const isWarehouse = loc.type === 'Warehouse';

          return (
            <Marker 
              key={loc.id} 
              coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
              pinColor={isWarehouse ? 'blue' : 'red'}
            >
              <Callout style={styles.callout}>
                <Text style={styles.calloutTitle}>{loc.name}</Text>
                <Text style={[styles.calloutType, { color: isWarehouse ? '#1565c0' : '#d84315' }]}>
                  {loc.type}
                </Text>
                {loc.address && <Text style={styles.calloutAddress}>{loc.address}</Text>}
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <Pressable style={styles.recenterButton} onPress={handleRecenter}>
        <Ionicons name="locate-outline" size={24} color={BRAND} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  recenterButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  callout: { width: 150, padding: 4 },
  calloutTitle: { fontWeight: 'bold', fontSize: 16, color: '#333', marginBottom: 2 },
  calloutType: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  calloutAddress: { fontSize: 12, color: '#666' }
});