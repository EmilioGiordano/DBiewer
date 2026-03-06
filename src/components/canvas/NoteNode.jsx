import { memo, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import useStore from '../../store/useStore';

function NoteNode({ id, data }) {
  const updateNote = useStore(s => s.updateNote);
  const deleteNote = useStore(s => s.deleteNote);

  const handleContentChange = useCallback((e) => {
    updateNote(id, { content: e.target.value });
  }, [id, updateNote]);

  return (
    <div
      style={{
        width: data.note.width || 180,
        minHeight: data.note.height || 80,
        background: data.note.color || '#fef08a',
        borderRadius: 4,
        padding: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        position: 'relative',
        cursor: 'grab',
      }}
    >
      <button
        onClick={() => deleteNote(id)}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          opacity: 0.4,
          padding: 2,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = 0.4}
      >
        <Trash2 size={12} color="#333" />
      </button>
      <textarea
        value={data.note.content}
        onChange={handleContentChange}
        placeholder="Write a note..."
        style={{
          width: '100%',
          minHeight: 50,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          color: '#1a1a2e',
          fontSize: data.note.fontSize || 14,
          fontFamily: 'inherit',
          lineHeight: 1.4,
        }}
      />
    </div>
  );
}

export default memo(NoteNode);
