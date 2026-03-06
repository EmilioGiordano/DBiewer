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

function buildEdges(relationships, tables) {
  return relationships.map(rel => {
    const fromTable = tables.find(t => t.id === rel.fromTable);
    const toTable = tables.find(t => t.id === rel.toTable);
    if (!fromTable || !toTable) return null;

    const fromRight = fromTable.position.x + (fromTable.width || 260) / 2 <
                      toTable.position.x + (toTable.width || 260) / 2;

    return {
      id: rel.id,
      type: 'relationship',
      source: rel.fromTable,
      target: rel.toTable,
      sourceHandle: fromRight ? `${rel.fromColumn}-right` : `${rel.fromColumn}-left-src`,
      targetHandle: fromRight ? `${rel.toColumn}-left` : `${rel.toColumn}-right-tgt`,
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
    // Update the tables array temporarily with the dragged position for edge calculation
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
