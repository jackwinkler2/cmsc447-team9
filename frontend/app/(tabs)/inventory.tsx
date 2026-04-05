import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { WAREHOUSES } from "@/constants/inventoryData";

function WarehouseCard({ id, name, itemCount }: { id: string; name: string; itemCount: number }) {
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/warehouse/${id}`)}>
      <Text style={styles.cardName}>{name}</Text>
      <Text style={styles.cardCount}>{itemCount} items</Text>
    </Pressable>
  );
}

export default function InventoryScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>Inventory</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {WAREHOUSES.map((warehouse) => (
            <WarehouseCard
              key={warehouse.id}
              id={warehouse.id}
              name={warehouse.name}
              itemCount={warehouse.items.length}
            />
          ))}
        </ScrollView>
      </View>
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
    padding: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "rgb(22, 13, 84)",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgb(22, 13, 84)",
  },
  cardCount: {
    fontSize: 14,
    color: "#666",
  },
});
