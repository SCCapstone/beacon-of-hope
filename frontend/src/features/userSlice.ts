// userSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AuthService from "../services/auth.service";

interface UserState {
    user: any | null,
    loading: boolean,
    error: string | null
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
        } catch(error: any) {
            return rejectWithValue(error.response.data.message || "An error occurred during login.")
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
                state.error = action.payload as string
            })
    }
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;