import { useCallback, useState, useRef } from 'react';
import {
  Table2, StickyNote, Undo2, Redo2, Save, Download, Upload,
  FileJson, Image, FileCode, Settings, Search, Trash2,
  Database, ChevronDown, PanelLeftClose, PanelLeft, Sun, Moon,
  LayoutGrid,
} from 'lucide-react';
import useStore from '../../store/useStore';
import { DB_LABELS, DBMS } from '../../data/dbTypes';
import ImportModal from '../modals/ImportModal';
import ExportSQLModal from '../modals/ExportSQLModal';
import AutoLayoutModal from '../modals/AutoLayoutModal';

export default function Toolbar() {
  const diagramName = useStore(s => s.diagramName);
  const setDiagramName = useStore(s => s.setDiagramName);
  const dbms = useStore(s => s.dbms);
  const setDbms = useStore(s => s.setDbms);
  const addTable = useStore(s => s.addTable);
  const addNote = useStore(s => s.addNote);
  const undo = useStore(s => s.undo);
  const redo = useStore(s => s.redo);
  const saveToStorage = useStore(s => s.saveToStorage);
  const toggleSidebar = useStore(s => s.toggleSidebar);
  const sidebarOpen = useStore(s => s.sidebarOpen);
  const toggleCommandPalette = useStore(s => s.toggleCommandPalette);
  const clearAll = useStore(s => s.clearAll);
  const tables = useStore(s => s.tables);
  const relationships = useStore(s => s.relationships);
  const notes = useStore(s => s.notes);
  const loadSchema = useStore(s => s.loadSchema);

  const [showDbDropdown, setShowDbDropdown] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showExportSQL, setShowExportSQL] = useState(false);
  const [showAutoLayout, setShowAutoLayout] = useState(false);
  const fileInputRef = useRef(null);

  const handleExportJSON = useCallback(() => {
    const data = {
      diagramName,
      dbms,
      tables,
      relationships,
      notes,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${diagramName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowFileMenu(false);
  }, [diagramName, dbms, tables, relationships, notes]);

  const handleImportJSON = useCallback(() => {
    fileInputRef.current?.click();
    setShowFileMenu(false);
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const schema = JSON.parse(evt.target.result);
        loadSchema(schema);
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [loadSchema]);

  const handleExportImage = useCallback(() => {
    const flowEl = document.querySelector('.react-flow__viewport');
    if (!flowEl) return;
    import('https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm').then(({ toPng }) => {
      toPng(flowEl, {
        backgroundColor: '#1a1a2e',
        style: { transform: 'none' },
      }).then(dataUrl => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${diagramName.replace(/\s+/g, '_')}.png`;
        a.click();
      });
    }).catch(() => alert('Image export requires html-to-image package'));
    setShowFileMenu(false);
  }, [diagramName]);

  const handleSave = useCallback(() => {
    saveToStorage();
  }, [saveToStorage]);

  return (
    <>
      <div style={{
        height: 48,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 4,
        flexShrink: 0,
      }}>
        {/* Sidebar toggle */}
        <ToolbarButton
          icon={sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          onClick={toggleSidebar}
          title="Toggle sidebar (Ctrl+\\)"
        />

        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 6px' }} />

        {/* Diagram name */}
        <input
          value={diagramName}
          onChange={(e) => setDiagramName(e.target.value)}
          style={{
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: 4,
            padding: '4px 8px',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 600,
            width: 200,
            outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'transparent'}
        />

        {/* DBMS selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDbDropdown(!showDbDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '4px 10px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            <Database size={14} />
            {DB_LABELS[dbms]}
            <ChevronDown size={12} />
          </button>
          {showDbDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              overflow: 'hidden',
              zIndex: 100,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}>
              {Object.entries(DB_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setDbms(key); setShowDbDropdown(false); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    background: key === dbms ? 'var(--accent)' : 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 13,
                  }}
                  onMouseEnter={e => { if (key !== dbms) e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                  onMouseLeave={e => { if (key !== dbms) e.currentTarget.style.background = 'transparent'; }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 6px' }} />

        {/* File menu */}
        <div style={{ position: 'relative' }}>
          <ToolbarButton
            icon={<FileCode size={16} />}
            label="File"
            onClick={() => setShowFileMenu(!showFileMenu)}
          />
          {showFileMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 4,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                overflow: 'hidden',
                zIndex: 100,
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                minWidth: 200,
              }}
            >
              <MenuButton icon={<Upload size={14} />} label="Import SQL (DDL)" onClick={() => { setShowImport(true); setShowFileMenu(false); }} />
              <MenuButton icon={<Upload size={14} />} label="Import JSON" onClick={handleImportJSON} />
              <div style={{ height: 1, background: 'var(--border)' }} />
              <MenuButton icon={<Download size={14} />} label="Export SQL (DDL)" onClick={() => { setShowExportSQL(true); setShowFileMenu(false); }} />
              <MenuButton icon={<FileJson size={14} />} label="Export JSON" onClick={handleExportJSON} />
              <MenuButton icon={<Image size={14} />} label="Export Image (PNG)" onClick={handleExportImage} />
              <div style={{ height: 1, background: 'var(--border)' }} />
              <MenuButton icon={<Trash2 size={14} />} label="Clear all" onClick={() => { clearAll(); setShowFileMenu(false); }} danger />
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 6px' }} />

        {/* Add actions */}
        <ToolbarButton icon={<Table2 size={16} />} label="Add Table" onClick={() => addTable()} />
        <ToolbarButton icon={<StickyNote size={16} />} label="Note" onClick={() => addNote()} />

        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 6px' }} />

        {/* Auto Layout */}
        <ToolbarButton icon={<LayoutGrid size={16} />} label="Auto Layout" onClick={() => setShowAutoLayout(true)} />

        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 6px' }} />

        {/* Undo/Redo */}
        <ToolbarButton icon={<Undo2 size={16} />} onClick={undo} title="Undo (Ctrl+Z)" />
        <ToolbarButton icon={<Redo2 size={16} />} onClick={redo} title="Redo (Ctrl+Shift+Z)" />

        <div style={{ flex: 1 }} />

        {/* Right side */}
        <ToolbarButton icon={<Search size={16} />} onClick={toggleCommandPalette} title="Search (Ctrl+/)" />
        <ToolbarButton icon={<Save size={16} />} onClick={handleSave} title="Save (Ctrl+S)" />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {showExportSQL && <ExportSQLModal onClose={() => setShowExportSQL(false)} />}
      {showAutoLayout && <AutoLayoutModal onClose={() => setShowAutoLayout(false)} />}
    </>
  );
}

function ToolbarButton({ icon, label, onClick, title, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 8px',
        border: 'none',
        borderRadius: 5,
        background: active ? 'var(--accent)' : 'transparent',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: 12,
        whiteSpace: 'nowrap',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}

function MenuButton({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '8px 14px',
        border: 'none',
        background: 'transparent',
        color: danger ? 'var(--danger)' : 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: 13,
        textAlign: 'left',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon}
      {label}
    </button>
  );
}
