// userSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import AuthService from "../services/auth.service";

interface User {
  _id: string;
  name: string;
  first_name: string;
  last_name: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  allowPersonalization: boolean;
  demographicsInfo: {
    ethnicity: string;
    height: string;
    weight: string;
    age: number;
    gender: string;
  };
  dietaryRestrictions: string;
  dietary_preferences: {
    preferences: string[];
    numerical_preferences: {
      dairy: number;
      nuts: number;
      meat: number;
    };
  };
  health_info: {
    allergies: string[];
    conditions: string[];
  };
  meal_plan_config: {
    meal_configs: {
      meal_name: string;
      meal_time?: string;
      beverage: boolean;
      main_course: boolean;
      side: boolean;
      dessert: boolean;
    }[];
    num_days: number;
    num_meals: number;
  };
  plan_ids: string[];
  username: string;
  created_at: string;
  updated_at: string;
}

interface UserState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    user: JSON.parse(localStorage.getItem('user') || "null"),
    loading: false,
    error: null
}

export const loginUser = createAsyncThunk(
    "user/login",
    async ({email, password, rememberMe}: {email: string, password: string, rememberMe: boolean}, {rejectWithValue}) => {
        try {
            const res = await AuthService.login({email, password});

            if(rememberMe) {
                localStorage.setItem("user", JSON.stringify(res));
                localStorage.setItem("rememberMe", "true");
            } else {
                localStorage.removeItem("rememberMe");
            }
            return res;
        } catch(error: unknown) {
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            return rejectWithValue("An error occurred during login.");
        }
    }
);

export const updateUser = createAsyncThunk(
    "user/update",
    async (updatedFields: Partial<User>, {getState, rejectWithValue}) => {
        try {
            const state = getState() as { user: UserState };
            const userId = state.user.user?._id;
            
            // If no userId exists, this is a guest user - don't allow updates
            if (!userId) {
                return rejectWithValue("Guest users cannot update their information. Please create an account.");
            }

            const response = await axios.patch(
                `http://127.0.0.1:8000/beacon/user/update/${userId}`,
                updatedFields,
                { headers: { Authorization: `Bearer ${state.user.user?.token}` } }
            );
            
            // Merge the updated fields with the existing user state
            return {
                ...state.user.user,
                ...response.data
            };
        } catch (error: unknown) {
            if (error instanceof Error) {
                return rejectWithValue(error.message);
            }
            return rejectWithValue("Failed to update user");
        }
    }
);

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            localStorage.removeItem("user")
            localStorage.removeItem("rememberMe");
            sessionStorage.clear();
        },
        setGuestUser: (state) => {
            // Clear any existing user data from localStorage
            localStorage.removeItem("user");
            localStorage.removeItem("rememberMe");
            sessionStorage.clear();
            
            // Create a minimal guest user object
            state.user = {
                _id: "67ee9325af31921234bf1241",
                name: "Guest User",
                first_name: "Guest",
                last_name: "User",
                dateOfBirth: "",
                email: "guest@example.com",
                phone: "",
                allowPersonalization: false,
                demographicsInfo: {
                    ethnicity: "",
                    height: "",
                    weight: "",
                    age: 0,
                    gender: ""
                },
                dietaryRestrictions: "",
                dietary_preferences: {
                    preferences: [],
                    numerical_preferences: {
                        dairy: 0,
                        nuts: 0,
                        meat: 0
                    }
                },
                health_info: {
                    allergies: [],
                    conditions: []
                },
                meal_plan_config: {
                    meal_configs: [],
                    num_days: 0,
                    num_meals: 0
                },
                plan_ids: [],
                username: "guest",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                localStorage.setItem("user", JSON.stringify(action.payload));
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.user = action.payload;
                localStorage.setItem("user", JSON.stringify(action.payload));
            })
    }
});

export const { logout, setGuestUser } = userSlice.actions;
export default userSlice.reducer;