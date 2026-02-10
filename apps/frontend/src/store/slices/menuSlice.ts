import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
  imageUrl?: string;
}

interface MenuState {
  items: MenuItem[];
  categories: string[];
  loading: boolean;
  error: string | null;
}

const initialState: MenuState = {
  items: [],
  categories: [],
  loading: false,
  error: null,
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setMenuItems: (state, action: PayloadAction<MenuItem[]>) => {
      state.items = action.payload;
      state.categories = [...new Set(action.payload.map((item) => item.category))];
    },
    addMenuItem: (state, action: PayloadAction<MenuItem>) => {
      state.items.push(action.payload);
      if (!state.categories.includes(action.payload.category)) {
        state.categories.push(action.payload.category);
      }
    },
    updateMenuItem: (state, action: PayloadAction<MenuItem>) => {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeMenuItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    toggleAvailability: (state, action: PayloadAction<string>) => {
      const item = state.items.find((item) => item.id === action.payload);
      if (item) {
        item.available = !item.available;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setMenuItems,
  addMenuItem,
  updateMenuItem,
  removeMenuItem,
  toggleAvailability,
  clearError,
} = menuSlice.actions;

export default menuSlice.reducer;
