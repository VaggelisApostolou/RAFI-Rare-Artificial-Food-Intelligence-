import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.137.1:8000'; 

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginUser = async (email, password) => {
  try {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post('/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    await AsyncStorage.setItem('userToken', response.data.access_token);
    await AsyncStorage.setItem('userId', String(response.data.user_id));
    return response.data;
  } catch (error) {
    console.error("Σφάλμα σύνδεσης:", error);
    throw error;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/users/', userData);
    return response.data;
  } catch (error) {
    console.error("Σφάλμα εγγραφής:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  await AsyncStorage.removeItem('userToken');
  await AsyncStorage.removeItem('userId');
};

export const getDailyLog = async (userId, targetDate) => {
  try {
    const response = await api.get(`/daily_logs/${userId}/${targetDate}`);
    return response.data;
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση της ημέρας:", error);
    if (error.response && error.response.status === 404) {
      return null; 
    }
    throw error;
  }
};

export const getMonthlyLogs = async (userId, year, month) => {
  try {
    const response = await api.get(`/daily_logs/${userId}/month/${year}/${month}`);
    return response.data;
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση του μήνα:", error);
    throw error;
  }
};

export const createDailyLog = async (logData) => {
  try {
    const response = await api.post('/daily_logs/', logData);
    return response.data;
  } catch (error) {
    console.error("Σφάλμα κατά τη δημιουργία νέας ημέρας:", error);
    throw error;
  }
};

export default api;

export const createMeal = async (dailyLogId, mealData) => {
  try {
    const response = await api.post(`/meals/?daily_log_id=${dailyLogId}`, mealData);
    return response.data;
  } catch (error) {
    console.error("Σφάλμα κατά την προσθήκη γεύματος:", error);
    throw error;
  }
};

export const deleteMeal = async (mealId) => {
  try {
    const response = await api.delete(`/meals/${mealId}`);
    return response.data;
  } catch (error) {
    console.error("Σφάλμα κατά τη διαγραφή γεύματος:", error);
    throw error;
  }
};

export const getRecipes = async (userId) => {
  try {
    const response = await api.get(`/recipes/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση συνταγών:", error);
    throw error;
  }
};

export const createRecipe = async (userId, recipeData) => {
  try {
    const response = await api.post(`/recipes/${userId}`, recipeData);
    return response.data;
  } catch (error) {
    console.error("Σφάλμα κατά τη δημιουργία συνταγής:", error);
    throw error;
  }
};

export const getNutritionByBarcode = async (barcode) => {
  try {
    const response = await api.get(`/nutrition/barcode/${barcode}`);
    return response.data;
  } catch (error) {
    console.error("Σφάλμα κατά την ανάκτηση barcode:", error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error("Σφάλμα κατά την ενημέρωση στοιχείων χρήστη:", error);
    throw error;
  }
};