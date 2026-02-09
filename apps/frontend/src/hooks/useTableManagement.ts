import { useState, useCallback, useEffect } from 'react';
import { Table, TableStatus, UpdateTableStatusDto, CreateTableDto } from '../types/table.types';
import { tableApi } from '../api/table.api';

export const useTableManagement = (floorPlanId: string) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Fetch tables for the floor plan
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tableApi.getTablesByFloorPlan(floorPlanId);
      setTables(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  }, [floorPlanId]);

  // Update table status
  const updateTableStatus = useCallback(
    async (tableId: string, statusUpdate: UpdateTableStatusDto) => {
      try {
        const updatedTable = await tableApi.updateTableStatus(tableId, statusUpdate);
        
        setTables((prev) =>
          prev.map((table) => (table.id === tableId ? updatedTable : table))
        );
        
        return updatedTable;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update table status');
        throw err;
      }
    },
    []
  );

  // Move table (update position)
  const moveTable = useCallback(async (tableId: string, x: number, y: number) => {
    try {
      // Optimistic update
      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId ? { ...table, x, y } : table
        )
      );

      // Persist to server
      await tableApi.updateTable(tableId, { x, y });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move table');
      // Revert on error
      await fetchTables();
    }
  }, [fetchTables]);

  // Bulk move tables (for drag operations)
  const bulkMoveTable = useCallback(
    async (updates: Array<{ id: string; x: number; y: number }>) => {
      try {
        await tableApi.bulkUpdatePositions(updates);
        await fetchTables();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update table positions');
      }
    },
    [fetchTables]
  );

  // Create new table
  const createTable = useCallback(
    async (tableData: CreateTableDto) => {
      try {
        const newTable = await tableApi.createTable(tableData);
        setTables((prev) => [...prev, newTable]);
        return newTable;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create table');
        throw err;
      }
    },
    []
  );

  // Delete table
  const deleteTable = useCallback(async (tableId: string) => {
    try {
      await tableApi.deleteTable(tableId);
      setTables((prev) => prev.filter((table) => table.id !== tableId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete table');
      throw err;
    }
  }, []);

  // Assign table to section
  const assignTableToSection = useCallback(async (tableId: string, section: string) => {
    try {
      const updatedTable = await tableApi.assignToSection(tableId, section);
      setTables((prev) =>
        prev.map((table) => (table.id === tableId ? updatedTable : table))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign table to section');
      throw err;
    }
  }, []);

  // Get available tables for party size
  const getAvailableTablesForParty = useCallback(
    (partySize: number) => {
      return tables.filter(
        (table) =>
          table.status === TableStatus.AVAILABLE &&
          table.capacity >= partySize &&
          table.minCapacity <= partySize
      ).sort((a, b) => a.capacity - b.capacity); // Prefer smaller tables
    },
    [tables]
  );

  // Get occupancy statistics
  const getOccupancyStats = useCallback(() => {
    const total = tables.length;
    const occupied = tables.filter((t) => t.status === TableStatus.OCCUPIED).length;
    const dirty = tables.filter((t) => t.status === TableStatus.DIRTY).length;
    const available = tables.filter((t) => t.status === TableStatus.AVAILABLE).length;
    const reserved = tables.filter((t) => t.status === TableStatus.RESERVED).length;

    return {
      total,
      occupied,
      dirty,
      available,
      reserved,
      occupancyRate: total > 0 ? (occupied / total) * 100 : 0,
    };
  }, [tables]);

  // Get tables by status
  const getTablesByStatus = useCallback(
    (status: TableStatus) => {
      return tables.filter((table) => table.status === status);
    },
    [tables]
  );

  // Get tables by section
  const getTablesBySection = useCallback(
    (section: string) => {
      return tables.filter((table) => table.section === section);
    },
    [tables]
  );

  // Select table (for editing or viewing details)
  const selectTable = useCallback((table: Table | null) => {
    setSelectedTable(table);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return {
    tables,
    loading,
    error,
    selectedTable,
    fetchTables,
    updateTableStatus,
    moveTable,
    bulkMoveTable,
    createTable,
    deleteTable,
    assignTableToSection,
    getAvailableTablesForParty,
    getOccupancyStats,
    getTablesByStatus,
    getTablesBySection,
    selectTable,
  };
};