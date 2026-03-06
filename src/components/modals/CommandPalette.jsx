import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Table2, Columns, ArrowRight } from 'lucide-react';
import useStore from '../../store/useStore';

export default function CommandPalette() {
  const open = useStore(s => s.commandPaletteOpen);
  const toggleCommandPalette = useStore(s => s.toggleCommandPalette);
  const tables = useStore(s => s.tables);
  const setSelectedTable = useStore(s => s.setSelectedTable);
  const setSelectedColumn = useStore(s => s.setSelectedColumn);
  const addTable = useStore(s => s.addTable);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const items = useMemo(() => {
    const results = [];

    // Actions
    if (!query || 'add table'.includes(query.toLowerCase())) {
      results.push({ type: 'action', label: 'Add Table', action: () => addTable() });
    }

    // Tables
    for (const table of tables) {
      if (!query || table.name.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          type: 'table',
          label: table.name,
          sublabel: `${table.columns.length} columns`,
          color: table.color,
          action: () => setSelectedTable(table.id),
        });
      }

      // Columns
      for (const col of table.columns) {
        if (query && col.name.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            type: 'column',
            label: col.name,
            sublabel: `${table.name}.${col.name} (${col.type})`,
            color: table.color,
            action: () => setSelectedColumn(table.id, col.id),
          });
        }
      }
    }

    return results.slice(0, 20);
  }, [query, tables, addTable, setSelectedTable, setSelectedColumn]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && items[selectedIndex]) {
      items[selectedIndex].action();
      toggleCommandPalette();
    } else if (e.key === 'Escape') {
      toggleCommandPalette();
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '15vh',
        zIndex: 1000,
      }}
      onClick={toggleCommandPalette}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          width: 480,
          maxHeight: 400,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <Search size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search tables, columns, or actions..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>

        {/* Results */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {items.map((item, idx) => (
            <div
              key={idx}
              onClick={() => { item.action(); toggleCommandPalette(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                cursor: 'pointer',
                background: idx === selectedIndex ? 'var(--bg-tertiary)' : 'transparent',
                transition: 'background 0.05s',
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              {item.type === 'table' && (
                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
              )}
              {item.type === 'column' && (
                <ArrowRight size={12} style={{ color: item.color, flexShrink: 0 }} />
              )}
              {item.type === 'action' && (
                <Table2 size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.label}</div>
                {item.sublabel && (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.sublabel}</div>
                )}
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', opacity: 0.5 }}>{item.type}</span>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              No results found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
