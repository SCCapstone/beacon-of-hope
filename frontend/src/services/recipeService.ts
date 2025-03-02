import axios from 'axios';

const BACKEND_URL = 'http://127.0.0.1:8000';

export async function fetchRecipeInfo(foodId: string) {
  try {
    const response = await axios.get(`${BACKEND_URL}/beacon/get-recipe-info/${foodId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching recipe info for ID ${foodId}:`, error);
    throw error;
  }
}

export async function fetchBeverageInfo(bevId: string) {
  try {
    const response = await axios.get(`${BACKEND_URL}/beacon/get-beverage-info/${bevId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching beverage info for ID ${bevId}:`, error);
    throw error;
  }
}