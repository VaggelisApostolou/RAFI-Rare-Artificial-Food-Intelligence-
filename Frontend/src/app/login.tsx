import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { loginUser, registerUser } from '../api';
import { Colors } from '../theme';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const styles = getStyles(theme);
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !username)) {
      setErrorMsg('ΣΥΜΠΛΗΡΩΣΕ ΟΛΑ ΤΑ ΠΕΔΙΑ.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanUsername = username.trim();

    try {
      if (isLogin) {
        await loginUser(cleanEmail, cleanPassword);
        router.replace('/(tabs)');
      } else {
        await registerUser({ username: cleanUsername, email: cleanEmail, password: cleanPassword });
        await loginUser(cleanEmail, cleanPassword);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      setErrorMsg(isLogin ? 'ΛΑΘΟΣ ΣΤΟΙΧΕΙΑ.' : 'ΤΟ EMAIL ΥΠΑΡΧΕΙ ΗΔΗ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>RAFI_</Text>
      
      <View style={styles.card}>
        <Text style={styles.title}>{isLogin ? 'LOGIN' : 'REGISTER'}</Text>
        
        {errorMsg ? <Text style={styles.errorText}>* {errorMsg}</Text> : null}

        {!isLogin && (
          <>
            <Text style={styles.label}>USERNAME</Text>
            <TextInput 
              style={styles.input} 
              value={username} 
              onChangeText={setUsername} 
              autoCapitalize="none"
            />
          </>
        )}

        <Text style={styles.label}>EMAIL</Text>
        <TextInput 
          style={styles.input} 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none" 
          keyboardType="email-address"
        />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput 
          style={styles.input} 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry
          autoCapitalize="none" 
        />

        <TouchableOpacity style={styles.btnPrimary} onPress={handleAuth} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <Text style={styles.btnPrimaryText}>{isLogin ? 'ENTER' : 'CREATE'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 20 }}>
          <Text style={styles.toggleText}>
            {isLogin ? 'NO ACCOUNT? [ REGISTER ]' : 'HAVE ACCOUNT? [ LOGIN ]'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, justifyContent: 'center', padding: 20 },
  logoText: { fontFamily: 'SpaceMonoBold', fontSize: 48, color: theme.text, textAlign: 'center', marginBottom: 40, letterSpacing: -2 },
  card: { backgroundColor: theme.card, padding: 25, borderWidth: 2, borderColor: theme.border, borderBottomWidth: 8, borderRightWidth: 6 },
  title: { fontFamily: 'SpaceMonoBold', fontSize: 24, color: theme.text, marginBottom: 20, textDecorationLine: 'underline' },
  label: { fontFamily: 'SpaceMonoBold', fontSize: 12, color: theme.text, marginBottom: 8, marginTop: 10, letterSpacing: 1 },
  input: { fontFamily: 'SpaceMonoBold', backgroundColor: theme.background, padding: 14, color: theme.text, fontSize: 14, borderWidth: 2, borderColor: theme.border, marginBottom: 5 },
  btnPrimary: { backgroundColor: theme.primary, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: theme.border, borderBottomWidth: 6, borderRightWidth: 4, marginTop: 20 },
  btnPrimaryText: { fontFamily: 'SpaceMonoBold', color: '#161412', fontSize: 18, letterSpacing: 2 },
  toggleText: { fontFamily: 'SpaceMonoBold', color: theme.muted, fontSize: 12, textAlign: 'center' },
  errorText: { fontFamily: 'SpaceMonoBold', color: theme.danger, fontSize: 12, marginBottom: 10 }
});