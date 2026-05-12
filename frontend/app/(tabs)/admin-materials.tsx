import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, ActivityIndicator, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const BRAND = "rgb(22, 13, 84)";
const IP = "130.85.251.186";

export default function AdminMaterialsScreen() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newName, setNewName] = useState('');
  const [newPhotoUri, setNewPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // search state
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`http://${IP}:5000/api/materials`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      setMaterials(await response.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchMaterials(); }, []));

  // image selection engine
  const handleSelectImage = async (materialId?: number) => {
    Alert.alert("Material Photo", "Choose an image source:", [
      { text: "Camera", onPress: () => launchMedia('camera', materialId) },
      { text: "Gallery", onPress: () => launchMedia('gallery', materialId) },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const launchMedia = async (type: 'camera' | 'gallery', materialId?: number) => {
    let result;
    if (type === 'camera') {
      await ImagePicker.requestCameraPermissionsAsync();
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 });
    } else {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 });
    }

    if (!result.canceled) {
      if (materialId) updateExistingMaterialPhoto(materialId, result.assets[0].uri);
      else setNewPhotoUri(result.assets[0].uri);
    }
  };

  const uploadImageToS3 = async (uri: string) => {
    const formData = new FormData();
    formData.append('file', { uri, name: 'material.jpg', type: 'image/jpeg' } as any);
    const res = await fetch(`http://${IP}:5000/api/upload-image`, { method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data' }});
    if (!res.ok) throw new Error("S3 Upload Failed");
    const data = await res.json();
    return data.photo_url;
  };

  const updateExistingMaterialPhoto = async (id: number, uri: string) => {
    try {
      Alert.alert("Uploading...", "Saving picture to AWS...");
      const s3Url = await uploadImageToS3(uri);
      
      await fetch(`http://${IP}:5000/api/materials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: s3Url })
      });
      
      Alert.alert("Success", "Catalog updated!");
      fetchMaterials();
    } catch (e) {
      Alert.alert("Error", "Could not upload image.");
    }
  };

  const handleCreateMaterial = async () => {
    if (!newName.trim()) return Alert.alert("Error", "Enter a material name.");
    setSubmitting(true);
    
    try {
      let finalUrl = null;
      if (newPhotoUri) finalUrl = await uploadImageToS3(newPhotoUri);

      const response = await fetch(`http://${IP}:5000/api/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), photo_url: finalUrl })
      });

      if (response.ok) {
        Alert.alert("Success", "Material added to catalog!");
        setNewName('');
        setNewPhotoUri(null);
        fetchMaterials();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to create material.");
    } finally {
      setSubmitting(false);
    }
  };

  // search logic
  const filteredMaterials = materials.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.listItem}>
      <Image source={{ uri: item.photo_url || "https://placehold.co/150/png?text=No+Photo" }} style={styles.itemImage} />
      <View style={{ flex: 1, paddingLeft: 12 }}>
        <Text style={styles.listName}>{item.name}</Text>
        <Text style={styles.listSubtext}>Catalog ID: #{item.id}</Text>
      </View>
      <Pressable style={styles.editButton} onPress={() => handleSelectImage(item.id)}>
        <Text style={styles.editButtonText}>📷 Edit Photo</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {loading ? (
        <ActivityIndicator size="large" color={BRAND} style={{flex: 1}} />
      ) : (
        <FlatList
          data={filteredMaterials}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={styles.formContainer}>
              <Text style={styles.headerTitle}>Master Catalog</Text>
              
              <View style={styles.newBox}>
                <Text style={styles.label}>Add New Material</Text>
                <TextInput style={styles.input} placeholder="Material Name (e.g., Copper Wire)" value={newName} onChangeText={setNewName} />
                
                <View style={styles.photoRow}>
                  <Pressable style={styles.cameraButton} onPress={() => handleSelectImage()}>
                    <Text style={styles.cameraText}>🖼️ {newPhotoUri ? "Change Image" : "Attach Picture"}</Text>
                  </Pressable>
                  {newPhotoUri && <Image source={{ uri: newPhotoUri }} style={styles.previewImage} />}
                </View>

                <Pressable style={styles.submitButton} onPress={handleCreateMaterial} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Add to Catalog</Text>}
                </Pressable>
              </View>
              
              <Text style={styles.sectionHeader}>Current Catalog</Text>
              {/* search bar 2 */}
              <TextInput
                style={styles.searchBar}
                placeholder="🔍 Search catalog by name..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>
          }
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>No materials match your search.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  formContainer: { padding: 16, backgroundColor: '#fff', marginBottom: 8, borderBottomWidth: 1, borderColor: '#ddd' },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: BRAND, marginBottom: 16 },
  newBox: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  label: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 16, backgroundColor: "#fff" },
  
  photoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  cameraButton: { flex: 1, backgroundColor: "#e8eaf6", padding: 14, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#c5cae9" },
  cameraText: { color: BRAND, fontWeight: "600", fontSize: 14 },
  previewImage: { width: 50, height: 50, borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  
  submitButton: { backgroundColor: BRAND, padding: 16, borderRadius: 8, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 32, paddingBottom: 12 },
  
  // Search Bar
  searchBar: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0' },

  listItem: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  itemImage: { width: 45, height: 45, borderRadius: 8, backgroundColor: '#eee' },
  listName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  listSubtext: { fontSize: 13, color: '#888', marginTop: 4 },
  editButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#e3f2fd', borderRadius: 6, borderWidth: 1, borderColor: '#90caf9' },
  editButtonText: { color: '#1565c0', fontWeight: 'bold', fontSize: 12 }
});