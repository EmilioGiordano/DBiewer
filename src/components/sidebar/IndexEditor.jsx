import { Trash2 } from 'lucide-react';
import useStore from '../../store/useStore';

export default function IndexEditor({ index, tableId, columns }) {
  const updateIndex = useStore(s => s.updateIndex);
  const deleteIndex = useStore(s => s.deleteIndex);

  const toggleColumn = (colId) => {
    const cols = index.columns.includes(colId)
      ? index.columns.filter(c => c !== colId)
      : [...index.columns, colId];
    updateIndex(tableId, index.id, { columns: cols });
  };

  return (
    <div style={{
      padding: '6px 12px',
      borderBottom: '1px solid rgba(255,255,255,0.03)',
      fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {/* Type selector */}
        <select
          value={index.type}
          onChange={(e) => updateIndex(tableId, index.id, { type: e.target.value, unique: e.target.value === 'UNIQUE' })}
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 3,
            padding: '2px 4px',
            color: 'var(--text-primary)',
            fontSize: 11,
            outline: 'none',
          }}
        >
          <option value="INDEX">INDEX</option>
          <option value="UNIQUE">UNIQUE</option>
          <option value="PRIMARY">PRIMARY</option>
        </select>

        <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 11 }}>
          ({index.columns.length} cols)
        </span>

        <button
          onClick={() => deleteIndex(tableId, index.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            padding: 2,
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Column checkboxes */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 4 }}>
        {columns.map(col => (
          <label
            key={col.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 11,
              color: index.columns.includes(col.id) ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={index.columns.includes(col.id)}
              onChange={() => toggleColumn(col.id)}
              style={{ accentColor: 'var(--accent)', width: 12, height: 12 }}
            />
            {col.name}
          </label>
        ))}
      </div>
    </div>
  );
}
