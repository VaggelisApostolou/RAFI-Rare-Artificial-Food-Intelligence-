import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { createRecipe, getRecipes } from '../../api';
import { Colors } from '../../theme';

const removeAccents = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export default function RecipesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const styles = getStyles(theme);

  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeCalories, setRecipeCalories] = useState('');
  const [recipeProtein, setRecipeProtein] = useState('');

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const storedId = await AsyncStorage.getItem('userId');
      if (!storedId) return;
      const data = await getRecipes(storedId); 
      setRecipes(data || []);
    } catch (error) {
      console.error("Πρόβλημα φόρτωσης συνταγών:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleSaveRecipe = async () => {
    if (!recipeName || !recipeCalories) {
      alert('Συμπλήρωσε τουλάχιστον το όνομα και τις θερμίδες!');
      return;
    }

    try {
      const storedId = await AsyncStorage.getItem('userId');
      if (!storedId) return;
      await createRecipe(storedId, {
        name: recipeName,
        calories: parseFloat(recipeCalories),
        protein_g: parseFloat(recipeProtein || "0")
      });

      setAddModalVisible(false);
      setRecipeName('');
      setRecipeCalories('');
      setRecipeProtein('');
      
      fetchRecipes();
    } catch (error) {
      console.error(error);
      alert('Αποτυχία αποθήκευσης συνταγής.');
    }
  };

  const renderRecipeItem = ({ item }: { item: any }) => (
    <View style={styles.recipeCard}>
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName}>{item.name}</Text>
        <View style={styles.macrosContainer}>
          <Text style={styles.macroTextGreen}>{Math.round(item.calories)} KCAL</Text>
          <Text style={styles.macroSeparator}> | </Text>
          <Text style={styles.macroTextBlue}>{Math.round(item.protein_g)}G PROT</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>ΣΥΝΤΑΓΕΣ</Text>

      <View style={styles.addCard}>
        <View style={styles.addInfo}>
          <Text style={styles.addTitle}>ΝΕΑ ΣΥΝΤΑΓΗ</Text>
          <Text style={styles.addSubtitle}>ΔΗΜΙΟΥΡΓΗΣΕ ΕΝΑ ΠΡΟΣΑΡΜΟΣΜΕΝΟ ΓΕΥΜΑ</Text>
        </View>
        <TouchableOpacity style={styles.brutalistBtnAdd} onPress={() => setAddModalVisible(true)}>
          <Text style={styles.brutalistBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>ΔΕΝ ΕΧΕΙΣ ΔΗΜΙΟΥΡΓΗΣΕΙ ΚΑΜΙΑ ΣΥΝΤΑΓΗ ΑΚΟΜΑ.</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRecipeItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={addModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.brutalistModal}>
            <Text style={styles.modalTitle}>ΔΗΜΙΟΥΡΓΙΑ ΣΥΝΤΑΓΗΣ</Text>
            
            <Text style={styles.inputLabel}>ΟΝΟΜΑ</Text>
            <TextInput 
              style={styles.brutalistInput} 
              placeholder="Π.Χ. ΠΡΩΙΝΟ ΒΡΩΜΗΣ" 
              placeholderTextColor={theme.muted}
              value={recipeName} 
              onChangeText={setRecipeName} 
            />

            <View style={{flexDirection: 'row', gap: 10}}>
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>KCAL</Text>
                <TextInput 
                  style={styles.brutalistInput} 
                  placeholder="0" 
                  placeholderTextColor={theme.muted}
                  keyboardType="numeric" 
                  value={recipeCalories} 
                  onChangeText={setRecipeCalories} 
                />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>PROT (G)</Text>
                <TextInput 
                  style={styles.brutalistInput} 
                  placeholder="0" 
                  placeholderTextColor={theme.muted}
                  keyboardType="numeric" 
                  value={recipeProtein} 
                  onChangeText={setRecipeProtein} 
                />
              </View>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.brutalistBtnSecondary} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.btnSecondaryText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.brutalistBtnPrimary} onPress={handleSaveRecipe}>
                <Text style={styles.btnPrimaryText}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 20, paddingTop: 50 },
  headerTitle: { fontFamily: 'SpaceMonoBold', fontSize: 32, letterSpacing: 4, marginBottom: 20, color: theme.text, textAlign: 'center' },
  
  addCard: { backgroundColor: theme.highlight, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: theme.border, borderBottomWidth: 6, borderRightWidth: 4, marginBottom: 25 },
  addInfo: { flex: 1 },
  addTitle: { fontFamily: 'SpaceMonoBold', fontSize: 16, color: theme.text, marginBottom: 4 },
  addSubtitle: { fontFamily: 'SpaceMonoBold', fontSize: 10, color: theme.text },
  
  brutalistBtnAdd: { backgroundColor: theme.card, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.border, borderBottomWidth: 4, borderRightWidth: 3 },
  brutalistBtnText: { fontFamily: 'SpaceMonoBold', fontSize: 24, color: theme.text },

  recipeCard: { backgroundColor: theme.card, padding: 16, marginBottom: 15, borderWidth: 2, borderColor: theme.border, borderBottomWidth: 5, borderRightWidth: 4 },
  recipeInfo: { flex: 1 },
  recipeName: { fontFamily: 'SpaceMonoBold', fontSize: 16, color: theme.text, marginBottom: 8 },
  macrosContainer: { flexDirection: 'row', alignItems: 'center' },
  macroTextGreen: { fontFamily: 'SpaceMonoBold', fontSize: 13, color: theme.primary },
  macroTextBlue: { fontFamily: 'SpaceMonoBold', fontSize: 13, color: theme.secondary },
  macroSeparator: { fontFamily: 'SpaceMonoBold', fontSize: 13, color: theme.muted, marginHorizontal: 6 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: 'SpaceMonoBold', color: theme.muted, fontSize: 14, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  brutalistModal: { backgroundColor: theme.card, padding: 25, borderWidth: 2, borderColor: theme.border, borderBottomWidth: 8, borderRightWidth: 6 },
  modalTitle: { fontFamily: 'SpaceMonoBold', fontSize: 22, color: theme.text, marginBottom: 20, textDecorationLine: 'underline' },
  
  inputLabel: { fontFamily: 'SpaceMonoBold', fontSize: 11, color: theme.text, letterSpacing: 1, marginBottom: 6, marginTop: 10 },
  brutalistInput: { fontFamily: 'SpaceMonoBold', backgroundColor: theme.background, padding: 14, color: theme.text, fontSize: 14, borderWidth: 2, borderColor: theme.border, marginBottom: 10 },

  modalButtonsRow: { flexDirection: 'row', marginTop: 20, gap: 15 },
  brutalistBtnPrimary: { flex: 1, backgroundColor: theme.primary, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: theme.border, borderBottomWidth: 6, borderRightWidth: 4 },
  brutalistBtnSecondary: { flex: 1, backgroundColor: theme.muted, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: theme.border, borderBottomWidth: 6, borderRightWidth: 4 },
  btnPrimaryText: { fontFamily: 'SpaceMonoBold', color: '#161412', fontSize: 16, letterSpacing: 1 },
  btnSecondaryText: { fontFamily: 'SpaceMonoBold', color: theme.text, fontSize: 16, letterSpacing: 1 },
});