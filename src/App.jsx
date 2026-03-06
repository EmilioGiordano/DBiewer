import { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import Canvas from './components/canvas/Canvas';
import Toolbar from './components/toolbar/Toolbar';
import Sidebar from './components/sidebar/Sidebar';
import CommandPalette from './components/modals/CommandPalette';
import useStore from './store/useStore';

export default function App() {
  const undo = useStore(s => s.undo);
  const redo = useStore(s => s.redo);
  const saveToStorage = useStore(s => s.saveToStorage);
  const toggleSidebar = useStore(s => s.toggleSidebar);
  const toggleCommandPalette = useStore(s => s.toggleCommandPalette);
  const addTable = useStore(s => s.addTable);
  const addNote = useStore(s => s.addNote);
  const addColumn = useStore(s => s.addColumn);
  const addIndex = useStore(s => s.addIndex);
  const deleteTable = useStore(s => s.deleteTable);
  const selectedTableId = useStore(s => s.selectedTableId);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+Z - Undo
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        if (!isInput) { e.preventDefault(); undo(); }
      }
      // Ctrl+Shift+Z - Redo
      if (ctrl && e.key === 'z' && e.shiftKey) {
        if (!isInput) { e.preventDefault(); redo(); }
      }
      // Ctrl+S - Save
      if (ctrl && e.key === 's') {
        e.preventDefault();
        saveToStorage();
      }
      // Ctrl+\ - Toggle sidebar
      if (ctrl && e.key === '\\') {
        e.preventDefault();
        toggleSidebar();
      }
      // Ctrl+/ - Command palette
      if (ctrl && e.key === '/') {
        e.preventDefault();
        toggleCommandPalette();
      }
      // Ctrl+Enter - Add column
      if (ctrl && e.key === 'Enter' && selectedTableId) {
        e.preventDefault();
        addColumn(selectedTableId);
      }
      // Ctrl+' - Add index
      if (ctrl && e.key === "'" && selectedTableId) {
        e.preventDefault();
        addIndex(selectedTableId);
      }
      // T - Add table (when not in input)
      if (e.key === 't' && !isInput && !ctrl) {
        e.preventDefault();
        addTable();
      }
      // N - Add note (when not in input)
      if (e.key === 'n' && !isInput && !ctrl) {
        e.preventDefault();
        addNote();
      }
      // Delete - Delete selected table (when not in input)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput && selectedTableId) {
        e.preventDefault();
        deleteTable(selectedTableId);
      }
      // Escape - Close command palette
      if (e.key === 'Escape') {
        const cpOpen = useStore.getState().commandPaletteOpen;
        if (cpOpen) toggleCommandPalette();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, saveToStorage, toggleSidebar, toggleCommandPalette, addTable, addNote, addColumn, addIndex, deleteTable, selectedTableId]);

  return (
    <ReactFlowProvider>
      <Toolbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <Canvas />
      </div>
      <CommandPalette />
    </ReactFlowProvider>
  );
}
