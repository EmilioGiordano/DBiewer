import { useState, useMemo } from 'react';
import { Trash2, ChevronDown, ChevronRight, Key, Snowflake } from 'lucide-react';
import useStore from '../../store/useStore';
import { DATA_TYPES, TYPES_WITH_LENGTH, DBMS } from '../../data/dbTypes';

export default function ColumnEditor({ column, tableId, index }) {
  const dbms = useStore(s => s.dbms);
  const updateColumn = useStore(s => s.updateColumn);
  const deleteColumn = useStore(s => s.deleteColumn);
  const selectedColumnId = useStore(s => s.selectedColumnId);
  const setSelectedColumn = useStore(s => s.setSelectedColumn);

  const [expanded, setExpanded] = useState(false);
  const [typeSearch, setTypeSearch] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const isSelected = selectedColumnId === column.id;
  const types = DATA_TYPES[dbms] || DATA_TYPES[DBMS.MYSQL];

  const filteredTypes = useMemo(() => {
    if (!typeSearch) return types;
    return types.filter(t => t.toLowerCase().includes(typeSearch.toLowerCase()));
  }, [types, typeSearch]);

  const update = (updates) => updateColumn(tableId, column.id, updates);

  return (
    <div
      style={{
        padding: '4px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        background: isSelected ? 'rgba(108,99,255,0.08)' : 'transparent',
      }}
      onClick={() => setSelectedColumn(tableId, column.id)}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0 }}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* Name */}
        <input
          value={column.name}
          onChange={(e) => update({ name: e.target.value })}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: column.primaryKey ? '#eab308' : 'var(--text-primary)',
            fontSize: 12,
            fontWeight: column.primaryKey ? 600 : 400,
            outline: 'none',
            padding: '2px 0',
            minWidth: 0,
          }}
        />

        {/* Type selector */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowTypeDropdown(!showTypeDropdown); }}
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 3,
              padding: '2px 6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 11,
              maxWidth: 100,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {column.type}{column.length ? `(${column.length})` : ''}
          </button>

          {showTypeDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 2,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                zIndex: 200,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                width: 180,
                maxHeight: 240,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={e => e.stopPropagation()}
            >
              <input
                autoFocus
                value={typeSearch}
                onChange={(e) => setTypeSearch(e.target.value)}
                placeholder="Search type..."
                style={{
                  background: 'var(--bg-primary)',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  padding: '6px 8px',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {filteredTypes.map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      update({ type: t });
                      setShowTypeDropdown(false);
                      setTypeSearch('');
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '5px 8px',
                      border: 'none',
                      background: t === column.type ? 'var(--accent)' : 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: 12,
                    }}
                    onMouseEnter={e => { if (t !== column.type) e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                    onMouseLeave={e => { if (t !== column.type) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Nullable toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); update({ nullable: !column.nullable }); }}
          title={column.nullable ? 'Nullable' : 'Not Null'}
          style={{
            background: column.nullable ? 'var(--warning)' : 'var(--bg-tertiary)',
            border: 'none',
            borderRadius: 3,
            color: column.nullable ? '#000' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 700,
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          N
        </button>

        {/* Delete */}
        <button
          onClick={(e) => { e.stopPropagation(); deleteColumn(tableId, column.id); }}
          title="Delete column"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            padding: 2,
            opacity: 0.5,
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = 0.5; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ paddingLeft: 20, paddingTop: 6, paddingBottom: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Length/Params */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', width: 60 }}>Length</label>
            <input
              value={column.length}
              onChange={(e) => update({ length: e.target.value })}
              placeholder="e.g. 255"
              style={{
                flex: 1,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 3,
                padding: '3px 6px',
                color: 'var(--text-primary)',
                fontSize: 11,
                outline: 'none',
              }}
            />
          </div>

          {/* Default */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', width: 60 }}>Default</label>
            <input
              value={column.default}
              onChange={(e) => update({ default: e.target.value })}
              placeholder="Default value"
              style={{
                flex: 1,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 3,
                padding: '3px 6px',
                color: 'var(--text-primary)',
                fontSize: 11,
                outline: 'none',
              }}
            />
          </div>

          {/* Comment */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', width: 60 }}>Comment</label>
            <input
              value={column.comment}
              onChange={(e) => update({ comment: e.target.value })}
              placeholder="Column comment"
              style={{
                flex: 1,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 3,
                padding: '3px 6px',
                color: 'var(--text-primary)',
                fontSize: 11,
                outline: 'none',
              }}
            />
          </div>

          {/* Enum values (if ENUM or SET) */}
          {(column.type === 'ENUM' || column.type === 'SET') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', width: 60 }}>Values</label>
              <input
                value={column.enumValues}
                onChange={(e) => update({ enumValues: e.target.value })}
                placeholder="val1, val2, val3"
                style={{
                  flex: 1,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 3,
                  padding: '3px 6px',
                  color: 'var(--text-primary)',
                  fontSize: 11,
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Checkboxes */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <CheckBox label="PK" checked={column.primaryKey} onChange={(v) => update({ primaryKey: v })} />
            <CheckBox label="Unique" checked={column.unique} onChange={(v) => update({ unique: v })} />
            <CheckBox label="Auto Inc" checked={column.autoIncrement} onChange={(v) => update({ autoIncrement: v })} />
            {dbms === DBMS.MYSQL && (
              <CheckBox label="Unsigned" checked={column.unsigned} onChange={(v) => update({ unsigned: v })} />
            )}
            {dbms === DBMS.POSTGRESQL && (
              <CheckBox label="Array" checked={column.isArray} onChange={(v) => update({ isArray: v })} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckBox({ label, checked, onChange }) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 11,
      color: 'var(--text-secondary)',
      cursor: 'pointer',
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: 'var(--accent)' }}
      />
      {label}
    </label>
  );
}
