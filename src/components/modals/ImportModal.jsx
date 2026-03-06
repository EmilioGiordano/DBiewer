import { useState, useCallback } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import useStore from '../../store/useStore';
import { parseDDL } from '../../utils/sqlParser';

export default function ImportModal({ onClose }) {
  const dbms = useStore(s => s.dbms);
  const tables = useStore(s => s.tables);
  const loadSchema = useStore(s => s.loadSchema);
  const diagramName = useStore(s => s.diagramName);

  const [sql, setSql] = useState('');
  const [result, setResult] = useState(null);
  const [overwrite, setOverwrite] = useState(false);

  const handleImport = useCallback(() => {
    if (!sql.trim()) return;

    const parsed = parseDDL(sql, dbms);
    setResult(parsed);

    if (parsed.tables.length > 0) {
      const existingTables = overwrite ? [] : tables;
      loadSchema({
        diagramName,
        dbms,
        tables: [...existingTables, ...parsed.tables],
        relationships: [...(overwrite ? [] : useStore.getState().relationships), ...parsed.relationships],
        notes: overwrite ? [] : useStore.getState().notes,
        groups: overwrite ? [] : useStore.getState().groups,
      });
    }
  }, [sql, dbms, overwrite, tables, loadSchema, diagramName]);

  const handleFile = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setSql(evt.target.result);
    reader.readAsText(file);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          width: 600,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Import SQL (DDL)</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, flex: 1, overflow: 'auto' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              border: '1px dashed var(--border)',
              borderRadius: 6,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: 13,
            }}>
              <Upload size={16} />
              Upload .sql file
              <input type="file" accept=".sql,.txt" onChange={handleFile} style={{ display: 'none' }} />
            </label>
          </div>

          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder={`Paste your CREATE TABLE statements here...\n\nExample:\nCREATE TABLE users (\n  id BIGINT AUTO_INCREMENT PRIMARY KEY,\n  name VARCHAR(255) NOT NULL,\n  email VARCHAR(255) UNIQUE NOT NULL\n);`}
            style={{
              width: '100%',
              height: 200,
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: 12,
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'monospace',
              resize: 'vertical',
              outline: 'none',
            }}
          />

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
            fontSize: 13,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
            />
            Clear existing tables before import
          </label>

          {/* Results */}
          {result && (
            <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-primary)', borderRadius: 6, fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)', marginBottom: 4 }}>
                <CheckCircle size={14} />
                Imported {result.tables.length} tables, {result.relationships.length} relationships
              </div>
              {result.errors.length > 0 && result.errors.map((err, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--warning)', marginTop: 4 }}>
                  <AlertCircle size={14} />
                  {err}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={!sql.trim()}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: 6,
                background: sql.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: '#fff',
                cursor: sql.trim() ? 'pointer' : 'not-allowed',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Begin Import
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
