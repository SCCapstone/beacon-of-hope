// store.ts

import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../features/userSlice';

export const store = configureStore({
    reducer: {
        user: userReducer,
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppStore = typeof store.dispatch;