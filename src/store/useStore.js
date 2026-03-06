import { create } from 'zustand';
import { DBMS, getDefaultColumns, TABLE_COLORS } from '../data/dbTypes';

const AUTOSAVE_KEY = 'drawdb-free-schema';

function loadFromStorage() {
  try {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

const saved = loadFromStorage();

const useStore = create((set, get) => ({
  // Schema metadata
  diagramName: saved?.diagramName || 'Untitled Diagram',
  dbms: saved?.dbms || DBMS.MYSQL,

  // Tables
  tables: saved?.tables || [],

  // Relationships
  relationships: saved?.relationships || [],

  // Notes
  notes: saved?.notes || [],

  // Groups
  groups: saved?.groups || [],

  // UI state
  selectedTableId: null,
  selectedColumnId: null,
  sidebarOpen: true,
  commandPaletteOpen: false,

  // Undo/Redo
  history: [],
  historyIndex: -1,

  // ----- Actions -----

  setDiagramName: (name) => set({ diagramName: name }),
  setDbms: (dbms) => set({ dbms }),
  setSelectedTable: (id) => set({ selectedTableId: id, selectedColumnId: null }),
  setSelectedColumn: (tableId, colId) => set({ selectedTableId: tableId, selectedColumnId: colId }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  _pushHistory: () => {
    const s = get();
    const snapshot = {
      tables: JSON.parse(JSON.stringify(s.tables)),
      relationships: JSON.parse(JSON.stringify(s.relationships)),
      notes: JSON.parse(JSON.stringify(s.notes)),
      groups: JSON.parse(JSON.stringify(s.groups)),
    };
    const history = s.history.slice(0, s.historyIndex + 1);
    history.push(snapshot);
    if (history.length > 50) history.shift();
    set({ history, historyIndex: history.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    set({
      tables: JSON.parse(JSON.stringify(prev.tables)),
      relationships: JSON.parse(JSON.stringify(prev.relationships)),
      notes: JSON.parse(JSON.stringify(prev.notes)),
      groups: JSON.parse(JSON.stringify(prev.groups)),
      historyIndex: historyIndex - 1,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    set({
      tables: JSON.parse(JSON.stringify(next.tables)),
      relationships: JSON.parse(JSON.stringify(next.relationships)),
      notes: JSON.parse(JSON.stringify(next.notes)),
      groups: JSON.parse(JSON.stringify(next.groups)),
      historyIndex: historyIndex + 1,
    });
  },

  // Table CRUD
  addTable: (position) => {
    const s = get();
    s._pushHistory();
    const colorIndex = s.tables.length % TABLE_COLORS.length;
    const table = {
      id: crypto.randomUUID(),
      name: `table_${s.tables.length + 1}`,
      comment: '',
      color: TABLE_COLORS[colorIndex],
      position: position || { x: 100 + s.tables.length * 30, y: 100 + s.tables.length * 30 },
      width: 260,
      columns: getDefaultColumns(s.dbms),
      indexes: [],
    };
    set({ tables: [...s.tables, table], selectedTableId: table.id });
    return table;
  },

  updateTable: (tableId, updates) => {
    const s = get();
    s._pushHistory();
    set({
      tables: s.tables.map(t => t.id === tableId ? { ...t, ...updates } : t),
    });
  },

  deleteTable: (tableId) => {
    const s = get();
    s._pushHistory();
    set({
      tables: s.tables.filter(t => t.id !== tableId),
      relationships: s.relationships.filter(r => r.fromTable !== tableId && r.toTable !== tableId),
      selectedTableId: s.selectedTableId === tableId ? null : s.selectedTableId,
    });
  },

  duplicateTable: (tableId) => {
    const s = get();
    s._pushHistory();
    const original = s.tables.find(t => t.id === tableId);
    if (!original) return;
    const newTable = {
      ...JSON.parse(JSON.stringify(original)),
      id: crypto.randomUUID(),
      name: `${original.name}_copy`,
      position: { x: original.position.x + 40, y: original.position.y + 40 },
    };
    newTable.columns.forEach(c => { c.id = crypto.randomUUID(); });
    newTable.indexes.forEach(i => { i.id = crypto.randomUUID(); });
    set({ tables: [...s.tables, newTable], selectedTableId: newTable.id });
  },

  moveTable: (tableId, position) => {
    set({
      tables: get().tables.map(t => t.id === tableId ? { ...t, position } : t),
    });
  },

  // Column CRUD
  addColumn: (tableId) => {
    const s = get();
    s._pushHistory();
    const col = {
      id: crypto.randomUUID(),
      name: 'column',
      type: 'VARCHAR',
      length: '255',
      primaryKey: false,
      autoIncrement: false,
      nullable: true,
      unique: false,
      default: '',
      comment: '',
      unsigned: false,
      enumValues: '',
      isArray: false,
    };
    set({
      tables: s.tables.map(t => t.id === tableId
        ? { ...t, columns: [...t.columns, col] }
        : t
      ),
      selectedColumnId: col.id,
    });
    return col;
  },

  updateColumn: (tableId, columnId, updates) => {
    const s = get();
    s._pushHistory();
    set({
      tables: s.tables.map(t => t.id === tableId
        ? { ...t, columns: t.columns.map(c => c.id === columnId ? { ...c, ...updates } : c) }
        : t
      ),
    });
  },

  deleteColumn: (tableId, columnId) => {
    const s = get();
    s._pushHistory();
    set({
      tables: s.tables.map(t => t.id === tableId
        ? {
            ...t,
            columns: t.columns.filter(c => c.id !== columnId),
            indexes: t.indexes
              .map(idx => ({ ...idx, columns: idx.columns.filter(c => c !== columnId) }))
              .filter(idx => idx.columns.length > 0),
          }
        : t
      ),
      relationships: s.relationships.filter(r =>
        !(r.fromTable === tableId && r.fromColumn === columnId) &&
        !(r.toTable === tableId && r.toColumn === columnId)
      ),
    });
  },

  reorderColumns: (tableId, fromIndex, toIndex) => {
    const s = get();
    s._pushHistory();
    set({
      tables: s.tables.map(t => {
        if (t.id !== tableId) return t;
        const cols = [...t.columns];
        const [moved] = cols.splice(fromIndex, 1);
        cols.splice(toIndex, 0, moved);
        return { ...t, columns: cols };
      }),
    });
  },

  // Index CRUD
  addIndex: (tableId) => {
    const s = get();
    s._pushHistory();
    const idx = {
      id: crypto.randomUUID(),
      name: '',
      columns: [],
      unique: false,
      type: 'INDEX',
    };
    set({
      tables: s.tables.map(t => t.id === tableId
        ? { ...t, indexes: [...t.indexes, idx] }
        : t
      ),
    });
  },

  updateIndex: (tableId, indexId, updates) => {
    const s = get();
    s._pushHistory();
    set({
      tables: s.tables.map(t => t.id === tableId
        ? { ...t, indexes: t.indexes.map(i => i.id === indexId ? { ...i, ...updates } : i) }
        : t
      ),
    });
  },

  deleteIndex: (tableId, indexId) => {
    const s = get();
    s._pushHistory();
    set({
      tables: s.tables.map(t => t.id === tableId
        ? { ...t, indexes: t.indexes.filter(i => i.id !== indexId) }
        : t
      ),
    });
  },

  // Relationships
  addRelationship: (rel) => {
    const s = get();
    s._pushHistory();
    const relationship = {
      id: crypto.randomUUID(),
      cardinality: '1:N',
      ...rel,
    };
    set({ relationships: [...s.relationships, relationship] });
    return relationship;
  },

  updateRelationship: (relId, updates) => {
    const s = get();
    s._pushHistory();
    set({
      relationships: s.relationships.map(r => r.id === relId ? { ...r, ...updates } : r),
    });
  },

  deleteRelationship: (relId) => {
    const s = get();
    s._pushHistory();
    set({ relationships: s.relationships.filter(r => r.id !== relId) });
  },

  // Notes
  addNote: (position) => {
    const s = get();
    s._pushHistory();
    const note = {
      id: crypto.randomUUID(),
      content: 'Note',
      position: position || { x: 200, y: 200 },
      color: '#fef08a',
      fontSize: 16,
      width: 180,
      height: 100,
    };
    set({ notes: [...s.notes, note] });
  },

  updateNote: (noteId, updates) => {
    const s = get();
    s._pushHistory();
    set({ notes: s.notes.map(n => n.id === noteId ? { ...n, ...updates } : n) });
  },

  deleteNote: (noteId) => {
    const s = get();
    s._pushHistory();
    set({ notes: s.notes.filter(n => n.id !== noteId) });
  },

  // Persistence
  saveToStorage: () => {
    const s = get();
    const data = {
      diagramName: s.diagramName,
      dbms: s.dbms,
      tables: s.tables,
      relationships: s.relationships,
      notes: s.notes,
      groups: s.groups,
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
  },

  loadSchema: (schema) => {
    const s = get();
    s._pushHistory();
    set({
      diagramName: schema.diagramName || 'Imported Diagram',
      dbms: schema.dbms || DBMS.MYSQL,
      tables: schema.tables || [],
      relationships: schema.relationships || [],
      notes: schema.notes || [],
      groups: schema.groups || [],
    });
  },

  clearAll: () => {
    const s = get();
    s._pushHistory();
    set({
      tables: [],
      relationships: [],
      notes: [],
      groups: [],
      selectedTableId: null,
      selectedColumnId: null,
    });
  },
}));

// Autosave every 30 seconds
setInterval(() => {
  useStore.getState().saveToStorage();
}, 30000);

export default useStore;
