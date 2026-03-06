import { useState } from 'react';
import {
  Table2, Plus, Trash2, Copy, ChevronDown, ChevronRight,
  Key, Snowflake, Hash, GripVertical, MessageSquare,
  ArrowRight, Settings,
} from 'lucide-react';
import useStore from '../../store/useStore';
import ColumnEditor from './ColumnEditor';
import IndexEditor from './IndexEditor';

export default function Sidebar() {
  const sidebarOpen = useStore(s => s.sidebarOpen);
  const tables = useStore(s => s.tables);
  const selectedTableId = useStore(s => s.selectedTableId);
  const setSelectedTable = useStore(s => s.setSelectedTable);
  const addTable = useStore(s => s.addTable);
  const deleteTable = useStore(s => s.deleteTable);
  const duplicateTable = useStore(s => s.duplicateTable);
  const updateTable = useStore(s => s.updateTable);
  const addColumn = useStore(s => s.addColumn);
  const addIndex = useStore(s => s.addIndex);

  const [expandedTables, setExpandedTables] = useState(new Set());

  if (!sidebarOpen) return null;

  const selectedTable = tables.find(t => t.id === selectedTableId);

  const toggleExpand = (id) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div style={{
      width: 320,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Table list header */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Tables ({tables.length})
        </span>
        <button
          onClick={() => addTable()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            border: 'none',
            borderRadius: 4,
            background: 'var(--accent)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          <Plus size={12} /> Add Table
        </button>
      </div>

      {/* Tables list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tables.length === 0 && (
          <div style={{
            padding: 20,
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: 13,
          }}>
            No tables yet. Click "Add Table" or press T to create one.
          </div>
        )}

        {tables.map(table => {
          const isExpanded = expandedTables.has(table.id);
          const isSelected = selectedTableId === table.id;
          return (
            <div key={table.id}>
              <div
                onClick={() => { setSelectedTable(table.id); toggleExpand(table.id); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                  borderLeft: `3px solid ${isSelected ? table.color : 'transparent'}`,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                {isExpanded ? <ChevronDown size={14} style={{ flexShrink: 0 }} /> : <ChevronRight size={14} style={{ flexShrink: 0 }} />}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: table.color,
                    marginLeft: 6,
                    flexShrink: 0,
                  }}
                />
                <span style={{
                  marginLeft: 8,
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 400,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {table.name}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {table.columns.length}
                </span>
              </div>

              {/* Expanded columns preview */}
              {isExpanded && (
                <div style={{ paddingLeft: 32, paddingBottom: 4 }}>
                  {table.columns.map(col => (
                    <div
                      key={col.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {col.primaryKey ? <Key size={10} color="#eab308" /> :
                       col.unique ? <Snowflake size={10} color="#06b6d4" /> :
                       <Hash size={10} style={{ opacity: 0.4 }} />}
                      <span style={{ color: col.primaryKey ? '#eab308' : 'var(--text-primary)' }}>
                        {col.name}
                      </span>
                      <span style={{ opacity: 0.5, fontSize: 11 }}>
                        {col.type.toLowerCase()}{col.length ? `(${col.length})` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected table editor */}
      {selectedTable && (
        <div style={{
          borderTop: '1px solid var(--border)',
          maxHeight: '55%',
          overflowY: 'auto',
          flexShrink: 0,
        }}>
          {/* Table name & actions */}
          <div style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: selectedTable.color,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            />
            <input
              value={selectedTable.name}
              onChange={(e) => updateTable(selectedTable.id, { name: e.target.value })}
              style={{
                flex: 1,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '4px 8px',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 600,
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={() => duplicateTable(selectedTable.id)}
              title="Duplicate table"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}
            >
              <Copy size={14} />
            </button>
            <button
              onClick={() => deleteTable(selectedTable.id)}
              title="Delete table"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Table comment */}
          <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
            <input
              value={selectedTable.comment}
              onChange={(e) => updateTable(selectedTable.id, { comment: e.target.value })}
              placeholder="Table comment..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: 12,
                outline: 'none',
              }}
            />
          </div>

          {/* Columns header */}
          <div style={{
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Columns
            </span>
            <button
              onClick={() => addColumn(selectedTable.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                padding: '3px 6px',
                border: '1px solid var(--border)',
                borderRadius: 4,
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 11,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={10} /> Add Column
            </button>
          </div>

          {/* Column editors */}
          {selectedTable.columns.map((col, idx) => (
            <ColumnEditor
              key={col.id}
              column={col}
              tableId={selectedTable.id}
              index={idx}
            />
          ))}

          {/* Indexes header */}
          <div style={{
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Indexes
            </span>
            <button
              onClick={() => addIndex(selectedTable.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                padding: '3px 6px',
                border: '1px solid var(--border)',
                borderRadius: 4,
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 11,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={10} /> Add Index
            </button>
          </div>

          {selectedTable.indexes.map(idx => (
            <IndexEditor
              key={idx.id}
              index={idx}
              tableId={selectedTable.id}
              columns={selectedTable.columns}
            />
          ))}

          {selectedTable.indexes.length === 0 && (
            <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', opacity: 0.5 }}>
              No composite indexes
            </div>
          )}
        </div>
      )}
    </div>
  );
}
