import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './supabase';

export default function App() {
  const [message, setMessage] = useState('Testing Supabase connection...');

  useEffect(() => {
    testConnection();
  }, []);

  async function testConnection() {
    try {
      const { error } = await supabase.from('department_kpis').select('*').limit(1);

      if (error) {
        setMessage(`Supabase error: ${error.message}`);
        return;
      }

      setMessage('FVH Pulse Mobile is connected to Supabase ✅');
    } catch (err) {
      setMessage(`Connection failed: ${err.message}`);
    }
  }

  return (
    <View style={styles.container}>
      <Text>{message}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});