import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { getMonthlyLogs } from '../../api';
import { Colors } from '../../theme';

const { width } = Dimensions.get('window');

const removeAccents = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const styles = getStyles(theme);

  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [monthlyLogs, setMonthlyLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [calTooltip, setCalTooltip] = useState<{x: number, y: number, value: number} | null>(null);
  const [protTooltip, setProtTooltip] = useState<{x: number, y: number, value: number} | null>(null);

  const [calorieGoal, setCalorieGoal] = useState(2500);
  const [proteinGoal, setProteinGoal] = useState(160);

  useFocusEffect(
    React.useCallback(() => {
      const loadGoals = async () => {
        const savedCal = await AsyncStorage.getItem('calorieGoal');
        const savedProt = await AsyncStorage.getItem('proteinGoal');
        if (savedCal) setCalorieGoal(Number(savedCal));
        if (savedProt) setProteinGoal(Number(savedProt));
      };
      loadGoals();
    }, [])
  );

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const storedId = await AsyncStorage.getItem('userId');
        if (!storedId) return;
        const year = referenceDate.getFullYear();
        const month = referenceDate.getMonth() + 1;
        const data = await getMonthlyLogs(storedId, year, month); 
        setMonthlyLogs(data || []);
      } catch (error) {
        console.error("Σφάλμα φόρτωσης analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [referenceDate.getMonth(), referenceDate.getFullYear()]);

  useEffect(() => {
    setCalTooltip(null);
    setProtTooltip(null);
  }, [viewMode, referenceDate]);

  const goBack = () => {
    const newDate = new Date(referenceDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setReferenceDate(newDate);
  };

  const goForward = () => {
    const newDate = new Date(referenceDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setReferenceDate(newDate);
  };

  const chartData = useMemo(() => {
    let labels: string[] = [];
    let caloriesData: number[] = [];
    let proteinData: number[] = [];

    const mealTotals: Record<string, { cal: number, prot: number, label: string, color: string }> = {
      breakfast: { cal: 0, prot: 0, label: 'ΠΡΩΙΝΟ', color: theme.primary },
      morning_snack: { cal: 0, prot: 0, label: 'ΔΕΚΑΤΙΑΝΟ', color: theme.secondary },
      lunch: { cal: 0, prot: 0, label: 'ΜΕΣΗΜΕΡΙΑΝΟ', color: theme.highlight },
      afternoon_snack: { cal: 0, prot: 0, label: 'ΑΠΟΓΕΥΜ.', color: theme.danger },
      dinner: { cal: 0, prot: 0, label: 'ΒΡΑΔΙΝΟ', color: theme.text },
    };

    if (viewMode === 'week') {
      const dayOfWeek = referenceDate.getDay() === 0 ? 6 : referenceDate.getDay() - 1;
      const monday = new Date(referenceDate);
      monday.setDate(referenceDate.getDate() - dayOfWeek);

      labels = ['Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ', 'Κ'];

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(monday);
        currentDate.setDate(monday.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];
        
        const log = monthlyLogs.find(l => l.log_date === dateString);
        caloriesData.push(log ? log.total_calories : 0);
        proteinData.push(log ? log.display_protein || log.total_protein_g : 0);

        if (log && log.meals) {
          log.meals.forEach((m: any) => {
            if (mealTotals[m.meal_type]) {
              mealTotals[m.meal_type].cal += m.calories;
              mealTotals[m.meal_type].prot += m.protein_g || 0;
            }
          });
        }
      }
    } else {
      const daysInMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        labels.push(i === 1 || i % 5 === 0 ? String(i) : '');
        
        const dateString = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const log = monthlyLogs.find(l => l.log_date === dateString);
        
        caloriesData.push(log ? log.total_calories : 0);
        proteinData.push(log ? log.display_protein || log.total_protein_g : 0);

        if (log && log.meals) {
          log.meals.forEach((m: any) => {
            if (mealTotals[m.meal_type]) {
              mealTotals[m.meal_type].cal += m.calories;
              mealTotals[m.meal_type].prot += m.protein_g || 0;
            }
          });
        }
      }
    }

    const totalCal = Object.values(mealTotals).reduce((sum, m) => sum + m.cal, 0);
    const totalProt = Object.values(mealTotals).reduce((sum, m) => sum + m.prot, 0);

    const pieCaloriesData = totalCal > 0 
      ? Object.values(mealTotals).filter(m => m.cal > 0).map(m => ({
          name: '% ' + m.label,
          population: Math.round((m.cal / totalCal) * 100),
          color: m.color,
          legendFontColor: theme.muted,
          legendFontSize: 11
        }))
      : [];

    const pieProteinData = totalProt > 0 
      ? Object.values(mealTotals).filter(m => m.prot > 0).map(m => ({
          name: '% ' + m.label,
          population: Math.round((m.prot / totalProt) * 100),
          color: m.color,
          legendFontColor: theme.muted,
          legendFontSize: 11
        }))
      : [];

    return { labels, caloriesData, proteinData, pieCaloriesData, pieProteinData };
  }, [monthlyLogs, viewMode, referenceDate, theme]);

  const calDays = chartData.caloriesData.filter(v => v > 0);
  const avgCalories = calDays.length > 0 
    ? Math.round(calDays.reduce((a, b) => a + b, 0) / calDays.length) 
    : 0;
    
  const protDays = chartData.proteinData.filter(v => v > 0);
  const avgProtein = protDays.length > 0 
    ? Math.round(protDays.reduce((a, b) => a + b, 0) / protDays.length) 
    : 0;

  const dateTitleRaw = viewMode === 'week' 
    ? `ΕΒΔΟΜΑΔΑ ${referenceDate.getDate()} ${referenceDate.toLocaleString('el-GR', { month: 'short' })}`
    : referenceDate.toLocaleString('el-GR', { month: 'long', year: 'numeric' });
  const dateTitle = removeAccents(dateTitleRaw).toUpperCase();

  const maxCalData = Math.max(...chartData.caloriesData, calorieGoal);
  const yMaxCal = Math.ceil(maxCalData / 500) * 500; 
  const calSegments = Math.max(1, yMaxCal / 500); 

  const maxProtData = Math.max(...chartData.proteinData, proteinGoal);
  const yMaxProt = Math.ceil(maxProtData / 50) * 50;
  const protSegments = Math.max(1, yMaxProt / 50); 

  const chartConfigBase = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    fillShadowGradientOpacity: 0, 
    decimalPlaces: 0,
    color: (opacity = 1) => theme.border, 
    labelColor: (opacity = 1) => theme.text,
    style: { borderRadius: 0 },
    propsForBackgroundLines: { strokeWidth: 1, stroke: theme.border, strokeDasharray: "0" },
    propsForLabels: { fontFamily: 'SpaceMonoBold', fontSize: 10 }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.headerTitle}>ΑΝΑΛΥΣΗ</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, viewMode === 'week' && styles.toggleActive, { borderRightWidth: 2, borderColor: theme.border }]} 
          onPress={() => setViewMode('week')}
        >
          <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>ΕΒΔΟΜΑΔΑ</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, viewMode === 'month' && styles.toggleActive]} 
          onPress={() => setViewMode('month')}
        >
          <Text style={[styles.toggleText, viewMode === 'month' && styles.toggleTextActive]}>ΜΗΝΑΣ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateNavigator}>
        <TouchableOpacity onPress={goBack} style={styles.navButton}>
          <Text style={styles.navButtonText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.currentDateText}>{dateTitle}</Text>
        <TouchableOpacity onPress={goForward} style={styles.navButton}>
          <Text style={styles.navButtonText}>{">"}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>AVG KCAL</Text>
              <Text style={[styles.statValue, { color: theme.primary }]}>{avgCalories} <Text style={styles.statSubText}>/ {calorieGoal}</Text></Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>AVG PROT</Text>
              <Text style={[styles.statValue, { color: theme.secondary }]}>{avgProtein} <Text style={styles.statSubText}>/ {proteinGoal}G</Text></Text>
            </View>
          </View>

          <Text style={styles.chartTitle}>ΘΕΡΜΙΔΕΣ (KCAL)</Text>
          <View style={styles.chartWrapper}>
            <View>
              <LineChart
                data={{
                  labels: chartData.labels,
                  datasets: [
                    { data: chartData.caloriesData, color: () => theme.primary },
                    { data: [yMaxCal], withDots: false, color: () => 'rgba(0,0,0,0)' },
                    { data: Array(chartData.labels.length).fill(calorieGoal), withDots: false, color: () => theme.danger } 
                  ]
                }}
                width={width - 40}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                segments={calSegments}
                onDataPointClick={(data) => {
                  if (data.dataset.withDots === false) return; 
                  setCalTooltip({ x: data.x, y: data.y, value: data.value });
                }}
                chartConfig={{ ...chartConfigBase, propsForDots: { r: "4", strokeWidth: "2", stroke: theme.card } }}
                style={{ borderRadius: 0 }}
              />
              {calTooltip && (
                <View style={[styles.tooltipBox, { top: calTooltip.y - 45, left: calTooltip.x - 35, borderColor: theme.primary }]}>
                  <Text style={styles.tooltipText}>{Math.round(calTooltip.value)} <Text style={styles.tooltipUnit}>KCAL</Text></Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.pieWrapper}>
            <Text style={styles.pieTitle}>ΚΑΤΑΝΟΜΗ ΘΕΡΜΙΔΩΝ</Text>
            {chartData.pieCaloriesData.length > 0 ? (
              <PieChart
                data={chartData.pieCaloriesData}
                width={width - 40}
                height={160}
                chartConfig={chartConfigBase}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                center={[10, 0]}
                absolute 
              />
            ) : (
              <Text style={styles.emptyDataText}>[ ΔΕΝ ΥΠΑΡΧΟΥΝ ΔΕΔΟΜΕΝΑ ]</Text>
            )}
          </View>

          <Text style={styles.chartTitle}>ΠΡΩΤΕΪΝΗ (G)</Text>
          <View style={styles.chartWrapper}>
            <View>
              <LineChart
                data={{
                  labels: chartData.labels,
                  datasets: [
                    { data: chartData.proteinData, color: () => theme.secondary },
                    { data: [yMaxProt], withDots: false, color: () => 'rgba(0,0,0,0)' },
                    { data: Array(chartData.labels.length).fill(proteinGoal), withDots: false, color: () => theme.danger } 
                  ]
                }}
                width={width - 40}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                segments={protSegments} 
                onDataPointClick={(data) => {
                  if (data.dataset.withDots === false) return;
                  setProtTooltip({ x: data.x, y: data.y, value: data.value });
                }}
                chartConfig={{ ...chartConfigBase, propsForDots: { r: "4", strokeWidth: "2", stroke: theme.card } }}
                style={{ borderRadius: 0 }}
              />
              {protTooltip && (
                <View style={[styles.tooltipBox, { top: protTooltip.y - 45, left: protTooltip.x - 30, borderColor: theme.secondary }]}>
                  <Text style={styles.tooltipText}>{Math.round(protTooltip.value)} <Text style={styles.tooltipUnit}>G</Text></Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.pieWrapper}>
            <Text style={styles.pieTitle}>ΚΑΤΑΝΟΜΗ ΠΡΩΤΕΪΝΗΣ</Text>
            {chartData.pieProteinData.length > 0 ? (
              <PieChart
                data={chartData.pieProteinData}
                width={width - 40}
                height={160}
                chartConfig={chartConfigBase}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                center={[10, 0]}
                absolute 
              />
            ) : (
              <Text style={styles.emptyDataText}>[ ΔΕΝ ΥΠΑΡΧΟΥΝ ΔΕΔΟΜΕΝΑ ]</Text>
            )}
          </View>

        </>
      )}
    </ScrollView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 20, paddingTop: 50 },
  headerTitle: { fontFamily: 'SpaceMonoBold', fontSize: 32, letterSpacing: 4, marginBottom: 20, color: theme.text, textAlign: 'center' },
  
  toggleContainer: { flexDirection: 'row', backgroundColor: theme.card, marginBottom: 20, borderWidth: 2, borderColor: theme.border, borderBottomWidth: 5, borderRightWidth: 4 },
  toggleButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  toggleActive: { backgroundColor: theme.text },
  toggleText: { fontFamily: 'SpaceMonoBold', fontSize: 13, color: theme.muted },
  toggleTextActive: { color: theme.background },

  dateNavigator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: theme.card, paddingHorizontal: 15, paddingVertical: 12, borderWidth: 2, borderColor: theme.border, borderBottomWidth: 5, borderRightWidth: 5 },
  navButton: { paddingHorizontal: 10 },
  navButtonText: { fontFamily: 'SpaceMonoBold', fontSize: 20, color: theme.primary },
  currentDateText: { fontFamily: 'SpaceMonoBold', fontSize: 14, color: theme.text, letterSpacing: 1 },

  summaryCard: { flexDirection: 'row', backgroundColor: theme.card, padding: 20, marginBottom: 25, borderWidth: 2, borderColor: theme.border, borderBottomWidth: 6, borderRightWidth: 4 },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 2, height: '100%', backgroundColor: theme.border },
  statLabel: { fontFamily: 'SpaceMonoBold', fontSize: 11, color: theme.text, marginBottom: 6, letterSpacing: 1, textAlign: 'center' },
  statValue: { fontFamily: 'SpaceMonoBold', fontSize: 22, letterSpacing: -1 },
  statSubText: { fontFamily: 'SpaceMonoBold', fontSize: 12, color: theme.muted },

  chartTitle: { fontFamily: 'SpaceMonoBold', fontSize: 16, color: theme.text, marginBottom: 10, marginLeft: 5, letterSpacing: 1 },
  chartWrapper: { backgroundColor: theme.card, padding: 10, paddingTop: 20, marginBottom: 25, borderWidth: 2, borderColor: theme.border, borderBottomWidth: 6, borderRightWidth: 4, alignItems: 'center' },
  
  pieTitle: { fontFamily: 'SpaceMonoBold', fontSize: 14, color: theme.text, marginBottom: 15, textAlign: 'center', letterSpacing: 1 },
  pieWrapper: { backgroundColor: theme.card, paddingVertical: 20, marginBottom: 25, borderWidth: 2, borderColor: theme.border, borderBottomWidth: 6, borderRightWidth: 4, alignItems: 'center', minHeight: 120, justifyContent: 'center' },
  emptyDataText: { fontFamily: 'SpaceMonoBold', fontSize: 12, color: theme.muted, textAlign: 'center', marginTop: 10 },

  tooltipBox: { 
    position: 'absolute', 
    backgroundColor: theme.card, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  },
  tooltipText: { fontFamily: 'SpaceMonoBold', color: theme.text, fontSize: 12 },
  tooltipUnit: { fontFamily: 'SpaceMonoBold', fontSize: 10, color: theme.muted }
});