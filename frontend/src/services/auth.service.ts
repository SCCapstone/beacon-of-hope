import axios from "axios";

const API_URL = "http://127.0.0.1:8000/beacon/user/";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface SignUpData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  demographicsInfo: {
    ethnicity: string;
    height: string;
    weight: string;
    age: number;
    gender: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserResponse {
  _id: string;
  username?: string; // optional depending backend
  email: string;
  plan_ids: string[];
  dietary_preferences: {
    preferences: string[];
    numerical_preferences: {
      dairy: number;
      nuts: number;
      meat: number;
    };
  };
  health_info?: {
    allergies: string[];
    conditions: string[];
  };
  demographicsInfo: {
    ethnicity: string;
    height: string;
    weight: string;
    age: number;
    gender: string;
  };
  meal_plan_config?: {
    num_days: number;
    num_meals: number;
    meal_configs: {
      meal_name: string;
      meal_time?: string;
      beverage: boolean;
      main_course: boolean;
      side: boolean;
      dessert: boolean;
    }[];
  };
  created_at: string;
  updated_at: string;
}

class AuthService {
  async login(loginData: LoginData): Promise<UserResponse> {
    try {
      const response = await axiosInstance.post("login", loginData);
      if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
        sessionStorage.setItem("user_id", response.data._id);
        sessionStorage.setItem("plan_ids", JSON.stringify(response.data.plan_ids ?? []));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async signup(signupData: SignUpData): Promise<UserResponse> {
    try {
      const response = await axiosInstance.post("signup", signupData);
      if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
        sessionStorage.setItem("user_id", response.data._id);
        sessionStorage.setItem("plan_ids", JSON.stringify(response.data.plan_ids ?? []));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async requestSecurityQuestion(email: string): Promise<{ security_question: string }> {
    // Remove the trailing slash from the URL
    const response = await axiosInstance.post("forgot-password/request", { email });
    return response.data;
}

async verifySecurityAnswer(email: string, answer: string): Promise<{ success: boolean }> {
    const response = await axiosInstance.post("forgot-password/verify", { email, security_answer: answer });
    return response.data;
}

async resetPassword(email: string, newPassword: string): Promise<{ success: boolean }> {
    const response = await axiosInstance.post("forgot-password/reset", { email, new_password: newPassword });
    return response.data;
}

  logout(): void {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user_id");
    sessionStorage.removeItem("plan_ids");
  }
}

export default new AuthService();
