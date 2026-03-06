import { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import TableNode from './TableNode';
import NoteNode from './NoteNode';
import RelationshipEdge from './RelationshipEdge';
import useStore from '../../store/useStore';

const nodeTypes = { table: TableNode, note: NoteNode };
const edgeTypes = { relationship: RelationshipEdge };

function buildNodes(tables, notes, selectedTableId) {
  const tableNodes = tables.map(table => ({
    id: table.id,
    type: 'table',
    position: { ...table.position },
    data: { table },
    dragHandle: '.drag-handle',
    selected: table.id === selectedTableId,
  }));

  const noteNodes = notes.map(note => ({
    id: note.id,
    type: 'note',
    position: { ...note.position },
    data: { note },
  }));

  return [...tableNodes, ...noteNodes];
}

// Minimum gap between near edges for clean cross-side routing
const CROSS_SIDE_MIN_GAP = 80;

function buildEdges(relationships, tables) {
  return relationships.map(rel => {
    const fromTable = tables.find(t => t.id === rel.fromTable);
    const toTable = tables.find(t => t.id === rel.toTable);
    if (!fromTable || !toTable) return null;

    const fw = fromTable.width || 260;
    const tw = toTable.width || 260;
    const fromL = fromTable.position.x;
    const fromR = fromL + fw;
    const toL = toTable.position.x;
    const toR = toL + tw;

    // Gap between near edges (negative means overlap)
    // If from is left of to: gap = toL - fromR
    // If from is right of to: gap = fromL - toR
    const fromIsLeft = fromL + fw / 2 < toL + tw / 2;
    const edgeGap = fromIsLeft ? (toL - fromR) : (fromL - toR);

    let sourceHandle, targetHandle;

    if (edgeGap >= CROSS_SIDE_MIN_GAP) {
      // Tables are well separated — clean cross-side routing
      sourceHandle = fromIsLeft ? `${rel.fromColumn}-right` : `${rel.fromColumn}-left-src`;
      targetHandle = fromIsLeft ? `${rel.toColumn}-left` : `${rel.toColumn}-right-tgt`;
    } else {
      // Tables are close or overlapping — use same-side routing
      // Pick the side with more space / tighter alignment
      const rightSpread = Math.abs(fromR - toR);
      const leftSpread = Math.abs(fromL - toL);
      const useRight = rightSpread <= leftSpread;

      if (useRight) {
        sourceHandle = `${rel.fromColumn}-right`;
        targetHandle = `${rel.toColumn}-right-tgt`;
      } else {
        sourceHandle = `${rel.fromColumn}-left-src`;
        targetHandle = `${rel.toColumn}-left`;
      }
    }

    return {
      id: rel.id,
      type: 'relationship',
      source: rel.fromTable,
      target: rel.toTable,
      sourceHandle,
      targetHandle,
      data: {
        cardinality: rel.cardinality,
        fromTable: rel.fromTable,
        toTable: rel.toTable,
      },
    };
  }).filter(Boolean);
}

export default function Canvas() {
  const tables = useStore(s => s.tables);
  const relationships = useStore(s => s.relationships);
  const notes = useStore(s => s.notes);
  const moveTable = useStore(s => s.moveTable);
  const updateNote = useStore(s => s.updateNote);
  const addRelationship = useStore(s => s.addRelationship);
  const setSelectedTable = useStore(s => s.setSelectedTable);
  const selectedTableId = useStore(s => s.selectedTableId);

  // React Flow managed state for smooth dragging
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Track whether drag is in progress to avoid store->RF sync during drag
  const isDragging = useRef(false);

  // Sync store -> React Flow nodes when store data changes (not during drag)
  useEffect(() => {
    if (!isDragging.current) {
      setNodes(buildNodes(tables, notes, selectedTableId));
    }
  }, [tables, notes, selectedTableId, setNodes]);

  // Sync store -> React Flow edges when relationships or table positions change
  useEffect(() => {
    setEdges(buildEdges(relationships, tables));
  }, [relationships, tables, setEdges]);

  // Rebuild edges during drag so lines follow the table
  const onNodeDrag = useCallback((event, node, dragNodes) => {
    isDragging.current = true;
    const updatedTables = tables.map(t =>
      t.id === node.id ? { ...t, position: node.position } : t
    );
    setEdges(buildEdges(relationships, updatedTables));
  }, [tables, relationships, setEdges]);

  const onNodeDragStop = useCallback((event, node) => {
    isDragging.current = false;
    if (node.type === 'table') {
      moveTable(node.id, node.position);
    } else if (node.type === 'note') {
      updateNote(node.id, { position: node.position });
    }
  }, [moveTable, updateNote]);

  const onConnect = useCallback((connection) => {
    const fromColumn = connection.sourceHandle?.replace(/-(?:left-src|left|right-tgt|right)$/, '');
    const toColumn = connection.targetHandle?.replace(/-(?:left-src|left|right-tgt|right)$/, '');

    if (fromColumn && toColumn && connection.source !== connection.target) {
      addRelationship({
        fromTable: connection.source,
        fromColumn,
        toTable: connection.target,
        toColumn,
        cardinality: '1:N',
      });
    }
  }, [addRelationship]);

  const onPaneClick = useCallback(() => {
    setSelectedTable(null);
  }, [setSelectedTable]);

  return (
    <div style={{ flex: 1, height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        minZoom={0.1}
        maxZoom={3}
        defaultEdgeOptions={{
          type: 'relationship',
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--canvas-dots)"
        />
        <Controls
          showInteractive={false}
          position="bottom-right"
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'note') return node.data.note?.color;
            return node.data.table?.color;
          }}
          maskColor="rgba(0, 0, 0, 0.3)"
          position="bottom-left"
        />
      </ReactFlow>
    </div>
  );
}
