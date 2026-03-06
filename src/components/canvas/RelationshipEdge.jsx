import { memo, useMemo } from 'react';
import { Position, EdgeLabelRenderer } from 'reactflow';
import useStore from '../../store/useStore';

const HEADER_H = 36;
const ROW_H = 30;
const INDEX_ROW_H = 22;
const MARGIN = 25;
const CORNER_R = 6;

function estimateTableHeight(table) {
  const colsH = (table.columns?.length || 1) * ROW_H;
  const idxH = (table.indexes?.length || 0) > 0 ? 8 + table.indexes.length * INDEX_ROW_H : 0;
  return HEADER_H + colsH + idxH;
}

function buildObstacles(tables, excludeIds) {
  return tables
    .filter(t => !excludeIds.has(t.id))
    .map(t => ({
      left: t.position.x - 8,
      right: t.position.x + (t.width || 260) + 8,
      top: t.position.y - 8,
      bottom: t.position.y + estimateTableHeight(t) + 8,
    }));
}

function segmentHitsObstacle(x, yMin, yMax, obstacles) {
  for (const obs of obstacles) {
    if (x >= obs.left && x <= obs.right && yMax >= obs.top && yMin <= obs.bottom) {
      return obs;
    }
  }
  return null;
}

function findClearCorridor(startX, endX, sy, ty, obstacles) {
  const yMin = Math.min(sy, ty);
  const yMax = Math.max(sy, ty);
  let corridorX = (startX + endX) / 2;

  for (let attempt = 0; attempt < 15; attempt++) {
    const hit = segmentHitsObstacle(corridorX, yMin, yMax, obstacles);
    if (!hit) return corridorX;
    // Shift to the side of the obstacle that's closer to the midpoint
    const toLeft = hit.left - MARGIN;
    const toRight = hit.right + MARGIN;
    const costLeft = Math.abs(startX - toLeft) + Math.abs(endX - toLeft);
    const costRight = Math.abs(startX - toRight) + Math.abs(endX - toRight);
    corridorX = costLeft <= costRight ? toLeft : toRight;
  }
  return corridorX;
}

function roundedPathFromPoints(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Direction vectors
    const dx1 = Math.sign(curr.x - prev.x);
    const dy1 = Math.sign(curr.y - prev.y);
    const dx2 = Math.sign(next.x - curr.x);
    const dy2 = Math.sign(next.y - curr.y);

    // Available length on each segment to apply rounding
    const lenIn = Math.max(Math.abs(curr.x - prev.x), Math.abs(curr.y - prev.y));
    const lenOut = Math.max(Math.abs(next.x - curr.x), Math.abs(next.y - curr.y));
    const r = Math.min(CORNER_R, lenIn / 2, lenOut / 2);

    if (r > 0 && (dx1 !== dx2 || dy1 !== dy2)) {
      const bx = curr.x - dx1 * r - dy1 * r; // not quite right for all cases
      // Simpler: line to just before corner, then quadratic curve
      const beforeX = curr.x - (dx1 !== 0 ? dx1 * r : 0);
      const beforeY = curr.y - (dy1 !== 0 ? dy1 * r : 0);
      const afterX = curr.x + (dx2 !== 0 ? dx2 * r : 0);
      const afterY = curr.y + (dy2 !== 0 ? dy2 * r : 0);
      d += ` L ${beforeX} ${beforeY}`;
      d += ` Q ${curr.x} ${curr.y} ${afterX} ${afterY}`;
    } else {
      d += ` L ${curr.x} ${curr.y}`;
    }
  }

  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

function computeAvoidingPath(sx, sy, tx, ty, sourcePosition, targetPosition, obstacles) {
  const goingRight = sourcePosition === Position.Right;
  const enteringFromRight = targetPosition === Position.Right;
  const enteringLeft = targetPosition === Position.Left;

  const exitX = goingRight ? sx + MARGIN : sx - MARGIN;

  let entryX;
  if (enteringLeft) {
    entryX = tx - MARGIN;
  } else if (enteringFromRight) {
    entryX = tx + MARGIN;
  } else {
    entryX = tx - MARGIN;
  }

  // Same-side routing (both right or both left): use a single corridor on that side
  const sameSide = (goingRight && enteringFromRight) || (!goingRight && enteringLeft);

  let corridorX;
  if (sameSide) {
    // Both handles on same side — corridor should be the further-out of the two
    corridorX = goingRight
      ? Math.max(exitX, entryX)
      : Math.min(exitX, entryX);
    // Check for obstacles and push further out if needed
    const yMin = Math.min(sy, ty);
    const yMax = Math.max(sy, ty);
    for (let attempt = 0; attempt < 10; attempt++) {
      const hit = segmentHitsObstacle(corridorX, yMin, yMax, obstacles);
      if (!hit) break;
      corridorX = goingRight ? hit.right + MARGIN : hit.left - MARGIN;
    }
  } else {
    corridorX = findClearCorridor(exitX, entryX, sy, ty, obstacles);
  }

  const points = [
    { x: sx, y: sy },
    { x: exitX, y: sy },
  ];

  // If corridor is different from exitX, add intermediate horizontal segment
  if (Math.abs(corridorX - exitX) > 2) {
    points.push({ x: corridorX, y: sy });
  }

  if (Math.abs(corridorX - entryX) > 2) {
    points.push({ x: corridorX, y: ty });
  }

  points.push({ x: entryX, y: ty });
  points.push({ x: tx, y: ty });

  // Deduplicate consecutive same-position points
  const cleaned = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = cleaned[cleaned.length - 1];
    if (Math.abs(points[i].x - prev.x) > 0.5 || Math.abs(points[i].y - prev.y) > 0.5) {
      cleaned.push(points[i]);
    }
  }

  return roundedPathFromPoints(cleaned);
}

function RelationshipEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, style = {},
}) {
  const deleteRelationship = useStore(s => s.deleteRelationship);
  const selectedTableId = useStore(s => s.selectedTableId);
  const tables = useStore(s => s.tables);

  const isHighlighted = data?.fromTable === selectedTableId || data?.toTable === selectedTableId;

  const obstacles = useMemo(() => {
    const exclude = new Set([data?.fromTable, data?.toTable]);
    return buildObstacles(tables, exclude);
  }, [tables, data?.fromTable, data?.toTable]);

  // Always use custom path for consistent same-side and cross-side routing
  const edgePath = computeAvoidingPath(
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition, obstacles
  );
  const labelX = (sourceX + targetX) / 2;
  const labelY = (sourceY + targetY) / 2;

  const cardinality = data?.cardinality || '1:N';
  const parts = cardinality.split(':');

  // Cardinality labels near source and target
  const srcLabelX = sourceX + (sourcePosition === Position.Right ? 18 : -18);
  const srcLabelY = sourceY - 14;
  const tgtLabelX = targetX + (targetPosition === Position.Left ? -18 : 18);
  const tgtLabelY = targetY - 14;

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
        {/* Source cardinality */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${srcLabelX}px,${srcLabelY}px)`,
            fontSize: 11,
            fontWeight: 600,
            color: isHighlighted ? '#6c63ff' : '#94a3b8',
            pointerEvents: 'none',
          }}
        >
          {parts[0]}
        </div>
        {/* Target cardinality */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${tgtLabelX}px,${tgtLabelY}px)`,
            fontSize: 11,
            fontWeight: 600,
            color: isHighlighted ? '#6c63ff' : '#94a3b8',
            pointerEvents: 'none',
          }}
        >
          {parts[1]}
        </div>
        {/* Delete button */}
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
