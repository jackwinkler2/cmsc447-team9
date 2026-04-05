import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { WAREHOUSES, Item } from "@/constants/inventoryData";

function ItemRow({ item }: { item: Item }) {
  return (
    <View style={styles.row}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemCount}>{item.count}</Text>
    </View>
  );
}

export default function WarehouseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const warehouse = WAREHOUSES.find((w) => w.id === id);

  if (!warehouse) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Warehouse not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>{warehouse.name}</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.headerLabel}>Material</Text>
          <Text style={styles.headerLabel}>Count</Text>
        </View>
        <FlatList
          data={warehouse.items}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => <ItemRow item={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
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
    fontSize: 24,
    fontWeight: "700",
    color: "rgb(22, 13, 84)",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "rgb(22, 13, 84)",
    marginBottom: 8,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgb(22, 13, 84)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  itemName: {
    fontSize: 15,
    color: "#333",
  },
  itemCount: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgb(22, 13, 84)",
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  error: {
    padding: 20,
    fontSize: 16,
    color: "#666",
  },
});
