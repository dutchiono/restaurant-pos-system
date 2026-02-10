import React, { useState, useRef, useCallback } from 'react';
import { Table, TableStatus, TableShape } from '../types/table.types';
import TableComponent from './Table';

interface FloorPlanEditorProps {
  tables: Table[];
  onTableMove: (tableId: string, x: number, y: number) => void;
  onTableClick: (table: Table) => void;
  onTableCreate: (x: number, y: number) => void;
  editorMode?: 'view' | 'edit';
  width?: number;
  height?: number;
}

export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({
  tables,
  onTableMove,
  onTableClick,
  onTableCreate,
  editorMode = 'view',
  width = 1200,
  height = 800,
}) => {
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTableMouseDown = useCallback(
    (tableId: string, event: React.MouseEvent) => {
      if (editorMode !== 'edit') return;
      
      event.preventDefault();
      const table = tables.find((t) => t.id === tableId);
      if (!table) return;

      const rect = event.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
      setDraggingTable(tableId);
    },
    [editorMode, tables]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!draggingTable || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left - dragOffset.x;
      const y = event.clientY - rect.top - dragOffset.y;

      // Constrain within bounds
      const table = tables.find((t) => t.id === draggingTable);
      if (!table) return;

      const constrainedX = Math.max(0, Math.min(x, width - table.width));
      const constrainedY = Math.max(0, Math.min(y, height - table.height));

      // Update position in real-time (optimistic update)
      onTableMove(draggingTable, constrainedX, constrainedY);
    },
    [draggingTable, dragOffset, tables, width, height, onTableMove]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingTable(null);
  }, []);

  const handleFloorPlanClick = useCallback(
    (event: React.MouseEvent) => {
      if (editorMode !== 'edit' || draggingTable) return;

      // Check if clicking on empty space (not a table)
      if (event.target === containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        onTableCreate(x, y);
      }
    },
    [editorMode, draggingTable, onTableCreate]
  );

  return (
    <div className="floor-plan-container">
      <div
        ref={containerRef}
        className="floor-plan-canvas"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          position: 'relative',
          backgroundColor: '#f5f5f5',
          border: '2px solid #ddd',
          borderRadius: '8px',
          cursor: editorMode === 'edit' ? 'crosshair' : 'default',
          overflow: 'hidden',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleFloorPlanClick}
      >
        {tables.map((table) => (
          <TableComponent
            key={table.id}
            table={table}
            onMouseDown={(e) => handleTableMouseDown(table.id, e)}
            onClick={() => onTableClick(table)}
            draggable={editorMode === 'edit'}
            isDragging={table.id === draggingTable}
          />
        ))}
        
        {/* Grid overlay for editor mode */}
        {editorMode === 'edit' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 20px),
                repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 20px)
              `,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
      
      {/* Editor controls */}
      {editorMode === 'edit' && (
        <div className="editor-controls" style={{ marginTop: '16px' }}>
          <div className="editor-info">
            <p>Click on empty space to add a new table</p>
            <p>Drag tables to reposition them</p>
            <p>Click on a table to edit its properties</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorPlanEditor;
