import { memo } from 'react';
import { getBezierPath, EdgeLabelRenderer } from 'reactflow';
import useStore from '../../store/useStore';

function RelationshipEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, style = {},
}) {
  const deleteRelationship = useStore(s => s.deleteRelationship);
  const selectedTableId = useStore(s => s.selectedTableId);

  const isHighlighted = data?.fromTable === selectedTableId || data?.toTable === selectedTableId;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
  });

  const cardinality = data?.cardinality || '1:N';
  const parts = cardinality.split(':');

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: isHighlighted ? '#6c63ff' : '#64748b',
          strokeWidth: isHighlighted ? 2.5 : 1.5,
          fill: 'none',
          transition: 'stroke 0.15s, stroke-width 0.15s',
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />
      <EdgeLabelRenderer>
        {/* Source label */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceX + (targetX - sourceX) * 0.15}px,${sourceY + (targetY - sourceY) * 0.15 - 12}px)`,
            fontSize: 11,
            fontWeight: 600,
            color: isHighlighted ? '#6c63ff' : '#94a3b8',
            pointerEvents: 'none',
          }}
        >
          {parts[0]}
        </div>
        {/* Target label */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceX + (targetX - sourceX) * 0.85}px,${sourceY + (targetY - sourceY) * 0.85 - 12}px)`,
            fontSize: 11,
            fontWeight: 600,
            color: isHighlighted ? '#6c63ff' : '#94a3b8',
            pointerEvents: 'none',
          }}
        >
          {parts[1]}
        </div>
        {/* Delete button on hover */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          <button
            onClick={() => deleteRelationship(id)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              color: 'var(--danger)',
              cursor: 'pointer',
              padding: '2px 6px',
              fontSize: 10,
              opacity: 0,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}
          >
            x
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(RelationshipEdge);
