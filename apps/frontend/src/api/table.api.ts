import { Table, UpdateTableStatusDto, CreateTableDto } from '../types/table.types';

// API base URL - should be configured via environment variables
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

export const tableApi = {
  // Get all tables for a specific floor plan
  async getTablesByFloorPlan(floorPlanId: string): Promise<Table[]> {
    const response = await fetch(`${API_BASE_URL}/tables?floorPlanId=${floorPlanId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tables: ${response.statusText}`);
    }
    return response.json();
  },

  // Get a single table by ID
  async getTableById(tableId: string): Promise<Table> {
    const response = await fetch(`${API_BASE_URL}/tables/${tableId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch table: ${response.statusText}`);
    }
    return response.json();
  },

  // Create a new table
  async createTable(tableData: CreateTableDto): Promise<Table> {
    const response = await fetch(`${API_BASE_URL}/tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tableData),
    });
    if (!response.ok) {
      throw new Error(`Failed to create table: ${response.statusText}`);
    }
    return response.json();
  },

  // Update table properties (position, dimensions, etc.)
  async updateTable(tableId: string, updates: Partial<Table>): Promise<Table> {
    const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error(`Failed to update table: ${response.statusText}`);
    }
    return response.json();
  },

  // Update table status (AVAILABLE, OCCUPIED, RESERVED, etc.)
  async updateTableStatus(tableId: string, statusUpdate: UpdateTableStatusDto): Promise<Table> {
    const response = await fetch(`${API_BASE_URL}/tables/${tableId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusUpdate),
    });
    if (!response.ok) {
      throw new Error(`Failed to update table status: ${response.statusText}`);
    }
    return response.json();
  },

  // Delete a table
  async deleteTable(tableId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete table: ${response.statusText}`);
    }
  },

  // Bulk update table positions (for drag operations)
  async bulkUpdatePositions(updates: Array<{ id: string; x: number; y: number }>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tables/bulk-update-positions`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    });
    if (!response.ok) {
      throw new Error(`Failed to bulk update positions: ${response.statusText}`);
    }
  },

  // Get tables by section
  async getTablesBySection(floorPlanId: string, section: string): Promise<Table[]> {
    const response = await fetch(`${API_BASE_URL}/tables?floorPlanId=${floorPlanId}&section=${section}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tables by section: ${response.statusText}`);
    }
    return response.json();
  },
};
