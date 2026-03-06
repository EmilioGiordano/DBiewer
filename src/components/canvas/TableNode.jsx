import { memo, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { GripVertical, Key, Snowflake, Hash, MessageSquare } from 'lucide-react';
import useStore from '../../store/useStore';

function TableNode({ id, data }) {
  const selectedTableId = useStore(s => s.selectedTableId);
  const setSelectedTable = useStore(s => s.setSelectedTable);
  const setSelectedColumn = useStore(s => s.setSelectedColumn);
  const selectedColumnId = useStore(s => s.selectedColumnId);

  const isSelected = selectedTableId === id;
  const { table } = data;
  const columns = table.columns || [];

  const handleSelect = useCallback((e) => {
    e.stopPropagation();
    setSelectedTable(id);
  }, [id, setSelectedTable]);

  const handleColumnClick = useCallback((e, colId) => {
    e.stopPropagation();
    setSelectedColumn(id, colId);
  }, [id, setSelectedColumn]);

  // Header height + column row height for handle positioning
  const HEADER_H = 36;
  const ROW_H = 30;

  return (
    <div
      className="animate-fade-in"
      onClick={handleSelect}
      style={{
        width: table.width || 260,
        minWidth: 220,
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        border: `2px solid ${isSelected ? table.color : 'var(--border)'}`,
        boxShadow: isSelected
          ? `0 0 0 1px ${table.color}40, 0 8px 24px rgba(0,0,0,0.3)`
          : '0 4px 12px rgba(0,0,0,0.2)',
        fontSize: 13,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        position: 'relative',
      }}
    >
      {/* Handles - each column gets 4 handles (source+target on each side) */}
      {columns.map((col, idx) => {
        const topPx = HEADER_H + idx * ROW_H + ROW_H / 2;
        const handleStyle = (side) => ({
          position: 'absolute',
          [side]: -5,
          top: topPx,
          width: 10,
          height: 10,
          background: col.primaryKey ? table.color : 'var(--border)',
          border: '2px solid var(--bg-secondary)',
          borderRadius: '50%',
          zIndex: 10,
        });
        return (
          <div key={col.id}>
            <Handle type="target" position={Position.Left} id={`${col.id}-left`} style={handleStyle('left')} />
            <Handle type="source" position={Position.Left} id={`${col.id}-left-src`} style={handleStyle('left')} />
            <Handle type="source" position={Position.Right} id={`${col.id}-right`} style={handleStyle('right')} />
            <Handle type="target" position={Position.Right} id={`${col.id}-right-tgt`} style={handleStyle('right')} />
          </div>
        );
      })}

      {/* Table Header */}
      <div
        style={{
          background: table.color,
          padding: '8px 12px',
          height: HEADER_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'grab',
          borderRadius: '6px 6px 0 0',
        }}
        className="drag-handle"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <GripVertical size={14} style={{ opacity: 0.6 }} />
          <span style={{ fontWeight: 600, color: '#fff', letterSpacing: 0.3 }}>
            {table.name}
          </span>
        </div>
        {table.comment && (
          <MessageSquare size={12} style={{ opacity: 0.7, color: '#fff' }} />
        )}
      </div>

      {/* Columns */}
      <div>
        {columns.map((col, idx) => {
          const isColSelected = selectedColumnId === col.id && isSelected;
          return (
            <div
              key={col.id}
              onClick={(e) => handleColumnClick(e, col.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                height: ROW_H,
                borderBottom: idx < columns.length - 1 ? '1px solid var(--border)' : 'none',
                background: isColSelected ? 'var(--bg-tertiary)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!isColSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={e => { if (!isColSelected) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Column icon */}
              <div style={{ width: 18, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                {col.primaryKey ? (
                  <Key size={12} style={{ color: '#eab308' }} />
                ) : col.unique ? (
                  <Snowflake size={12} style={{ color: '#06b6d4' }} />
                ) : (
                  <Hash size={11} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                )}
              </div>

              {/* Column name */}
              <span style={{
                flex: 1,
                color: col.primaryKey ? '#eab308' : 'var(--text-primary)',
                fontWeight: col.primaryKey ? 600 : 400,
                marginLeft: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {col.name}
              </span>

              {/* Type badge */}
              <span style={{
                color: 'var(--text-secondary)',
                fontSize: 11,
                marginLeft: 8,
                flexShrink: 0,
                opacity: 0.8,
              }}>
                {col.type.toLowerCase()}
                {col.length ? `(${col.length})` : ''}
              </span>

              {/* Nullable indicator */}
              {col.nullable && (
                <span style={{
                  color: 'var(--text-secondary)',
                  fontSize: 10,
                  marginLeft: 4,
                  opacity: 0.6,
                }}>?</span>
              )}

              {/* Comment icon */}
              {col.comment && (
                <MessageSquare size={10} style={{ marginLeft: 4, color: 'var(--text-secondary)', opacity: 0.5 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Indexes section */}
      {table.indexes && table.indexes.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '4px 10px',
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '0 0 6px 6px',
        }}>
          {table.indexes.map(idx => (
            <div key={idx.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: 'var(--text-secondary)',
              padding: '2px 0',
            }}>
              <Hash size={10} />
              <span style={{ opacity: 0.7 }}>
                {idx.unique ? 'UNIQUE' : 'INDEX'}
              </span>
              <span>
                ({idx.columns.map(cId => {
                  const col = columns.find(c => c.id === cId);
                  return col?.name || '?';
                }).join(', ')})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(TableNode);
