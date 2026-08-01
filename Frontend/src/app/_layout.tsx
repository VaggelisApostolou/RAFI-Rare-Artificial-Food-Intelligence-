import { SpaceMono_400Regular, SpaceMono_700Bold, useFonts } from '@expo-google-fonts/space-mono';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, useColorScheme, View } from 'react-native';
import { Colors } from '../theme';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  let [fontsLoaded] = useFonts({
    SpaceMono: SpaceMono_400Regular,
    SpaceMonoBold: SpaceMono_700Bold,
  });

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login' as any);
        }
      } catch (e) {
        console.error("Token error", e);
      } finally {
        setIsReady(true);
      }
    };

    if (fontsLoaded) {
      checkToken();
    }
  }, [fontsLoaded]);

  if (!isReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: fontsLoaded ? 'SpaceMonoBold' : 'System', fontSize: 32, color: theme.text, marginBottom: 20 }}>RAFI_</Text>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ fontFamily: fontsLoaded ? 'SpaceMonoBold' : 'System', fontSize: 12, color: theme.muted, marginTop: 20 }}>LOADING_SYSTEM...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}