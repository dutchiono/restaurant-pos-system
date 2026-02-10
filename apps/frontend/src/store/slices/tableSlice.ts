import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Table, TableStatus } from '../../types/table.types';
import { tableApi } from '../api/table.api';

interface TableState {
  tables: Table[];
  selectedTable: Table | null;
  loading: boolean;
  error: string | null;
}

const initialState: TableState = {
  tables: [],
  selectedTable: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchTables = createAsyncThunk(
  'tables/fetchTables',
  async (floorPlanId: string, { rejectWithValue }) => {
    try {
      return await tableApi.getTables(floorPlanId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchTable = createAsyncThunk(
  'tables/fetchTable',
  async (id: string, { rejectWithValue }) => {
    try {
      return await tableApi.getTable(id);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createTable = createAsyncThunk(
  'tables/createTable',
  async (data: Partial<Table>, { rejectWithValue }) => {
    try {
      return await tableApi.createTable(data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateTable = createAsyncThunk(
  'tables/updateTable',
  async ({ id, data }: { id: string; data: Partial<Table> }, { rejectWithValue }) => {
    try {
      return await tableApi.updateTable(id, data);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateTableStatus = createAsyncThunk(
  'tables/updateTableStatus',
  async ({ id, status }: { id: string; status: TableStatus }, { rejectWithValue }) => {
    try {
      return await tableApi.updateTableStatus(id, status);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateTablePosition = createAsyncThunk(
  'tables/updateTablePosition',
  async ({ id, x, y }: { id: string; x: number; y: number }, { rejectWithValue }) => {
    try {
      return await tableApi.updateTablePosition(id, x, y);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteTable = createAsyncThunk(
  'tables/deleteTable',
  async (id: string, { rejectWithValue }) => {
    try {
      await tableApi.deleteTable(id);
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const tableSlice = createSlice({
  name: 'tables',
  initialState,
  reducers: {
    selectTable: (state, action: PayloadAction<Table | null>) => {
      state.selectedTable = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Optimistic update for table position (for drag & drop)
    updateTablePositionOptimistic: (
      state,
      action: PayloadAction<{ id: string; x: number; y: number }>
    ) => {
      const table = state.tables.find((t) => t.id === action.payload.id);
      if (table) {
        table.x = action.payload.x;
        table.y = action.payload.y;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tables
      .addCase(fetchTables.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTables.fulfilled, (state, action) => {
        state.loading = false;
        state.tables = action.payload;
      })
      .addCase(fetchTables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch single table
      .addCase(fetchTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTable.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTable = action.payload;
      })
      .addCase(fetchTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create table
      .addCase(createTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTable.fulfilled, (state, action) => {
        state.loading = false;
        state.tables.push(action.payload);
      })
      .addCase(createTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update table
      .addCase(updateTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTable.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tables.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tables[index] = action.payload;
        }
        if (state.selectedTable?.id === action.payload.id) {
          state.selectedTable = action.payload;
        }
      })
      .addCase(updateTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update table status
      .addCase(updateTableStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTableStatus.fulfilled, (state, action) => {
        state.loading = false;
        const table = state.tables.find((t) => t.id === action.payload.id);
        if (table) {
          table.status = action.payload.status;
        }
        if (state.selectedTable?.id === action.payload.id) {
          state.selectedTable.status = action.payload.status;
        }
      })
      .addCase(updateTableStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update table position
      .addCase(updateTablePosition.pending, (state) => {
        // Don't set loading for optimistic updates
        state.error = null;
      })
      .addCase(updateTablePosition.fulfilled, () => {
        // Position already updated optimistically, just confirm
      })
      .addCase(updateTablePosition.rejected, (state, action) => {
        state.error = action.payload as string;
        // TODO: Revert optimistic update
      })
      // Delete table
      .addCase(deleteTable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTable.fulfilled, (state, action) => {
        state.loading = false;
        state.tables = state.tables.filter((t) => t.id !== action.payload);
        if (state.selectedTable?.id === action.payload) {
          state.selectedTable = null;
        }
      })
      .addCase(deleteTable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { selectTable, clearError, updateTablePositionOptimistic } =
  tableSlice.actions;

export default tableSlice.reducer;
