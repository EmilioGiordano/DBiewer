import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

const HEADER_H = 36;
const ROW_H = 30;
const INDEX_ROW_H = 22;
const INDEX_PADDING = 8;

function estimateTableHeight(table) {
  const colsH = (table.columns?.length || 1) * ROW_H;
  const idxCount = table.indexes?.length || 0;
  const idxH = idxCount > 0 ? INDEX_PADDING + idxCount * INDEX_ROW_H : 0;
  return HEADER_H + colsH + idxH;
}

function computeDegrees(tables, relationships) {
  const degrees = {};
  tables.forEach(t => { degrees[t.id] = { in: 0, out: 0, total: 0 }; });
  relationships.forEach(r => {
    if (degrees[r.fromTable]) {
      degrees[r.fromTable].out++;
      degrees[r.fromTable].total++;
    }
    if (degrees[r.toTable]) {
      degrees[r.toTable].in++;
      degrees[r.toTable].total++;
    }
  });
  return degrees;
}

const ALGORITHM_OPTIONS = {
  layered: {
    'elk.algorithm': 'layered',
    'elk.layered.spacing.nodeNodeBetweenLayers': '120',
    'elk.layered.spacing.edgeNodeBetweenLayers': '50',
    'elk.layered.spacing.edgeEdgeBetweenLayers': '20',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    'elk.layered.crossingMinimization.greedySwitch.type': 'TWO_SIDED',
    'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    'elk.layered.thoroughness': '20',
    'elk.edgeRouting': 'ORTHOGONAL',
    'elk.layered.mergeEdges': 'false',
    'elk.layered.unnecessaryBendpoints': 'false',
  },
  stress: {
    'elk.algorithm': 'stress',
    'elk.stress.desiredEdgeLength': '250',
  },
  mrtree: {
    'elk.algorithm': 'mrtree',
    'elk.mrtree.spacing.nodeNode': '50',
  },
  radial: {
    'elk.algorithm': 'radial',
    'elk.radial.radius': '250',
  },
  force: {
    'elk.algorithm': 'force',
    'elk.force.iterations': '300',
    'elk.force.repulsion': '25',
  },
};

const DIRECTION_MAP = {
  TB: 'DOWN',
  BT: 'UP',
  LR: 'RIGHT',
  RL: 'LEFT',
};

export const LAYOUT_ALGORITHMS = [
  { id: 'clean', label: 'Clean', description: 'Minimal crossings, ideal for ER diagrams' },
  { id: 'grid', label: 'Grid', description: 'Matrix layout with live spacing preview' },
  { id: 'layered', label: 'Hierarchical', description: 'ELK layered layout' },
  { id: 'stress', label: 'Stress', description: 'Stress-minimization, organic look' },
  { id: 'mrtree', label: 'Tree', description: 'Tree layout for hierarchical schemas' },
  { id: 'radial', label: 'Radial', description: 'Radial layout from central hub table' },
  { id: 'force', label: 'Force', description: 'Force-directed, physics simulation' },
];

export const LAYOUT_DIRECTIONS = [
  { id: 'TB', label: 'Top to Bottom' },
  { id: 'LR', label: 'Left to Right' },
  { id: 'BT', label: 'Bottom to Top' },
  { id: 'RL', label: 'Right to Left' },
];

function buildSpanningTree(relationships, sortedTables) {
  if (sortedTables.length === 0) return [];
  const tableIds = new Set(sortedTables.map(t => t.id));
  const adj = {};
  tableIds.forEach(id => { adj[id] = []; });
  relationships.forEach(r => {
    if (tableIds.has(r.fromTable) && tableIds.has(r.toTable)) {
      adj[r.fromTable].push(r);
      adj[r.toTable].push(r);
    }
  });
  const visited = new Set();
  const treeEdges = [];
  for (const table of sortedTables) {
    if (visited.has(table.id)) continue;
    const queue = [table.id];
    visited.add(table.id);
    while (queue.length > 0) {
      const current = queue.shift();
      for (const rel of adj[current]) {
        const neighbor = rel.fromTable === current ? rel.toTable : rel.fromTable;
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          treeEdges.push(rel);
          queue.push(neighbor);
        }
      }
    }
  }
  return treeEdges;
}

export async function computeAutoLayout(tables, relationships, options = {}) {
  const {
    algorithm = 'layered',
    direction = 'TB',
    spacing = 80,
    hubCenter = false,
  } = options;

  if (tables.length === 0) return { positions: {}, edgeRoutes: {} };

  // Clean layout uses custom Sugiyama implementation
  if (algorithm === 'clean') {
    return computeCleanLayout(tables, relationships, { direction, spacing });
  }

  const degrees = computeDegrees(tables, relationships);

  let sortedTables = [...tables];
  if ((algorithm === 'radial' || hubCenter) && relationships.length > 0) {
    sortedTables.sort((a, b) => degrees[b.id].total - degrees[a.id].total);
  }

  const algoOptions = { ...ALGORITHM_OPTIONS[algorithm] } || ALGORITHM_OPTIONS.layered;

  if (algorithm === 'layered' || algorithm === 'mrtree') {
    algoOptions['elk.direction'] = DIRECTION_MAP[direction] || 'DOWN';
  }

  algoOptions['elk.spacing.nodeNode'] = String(spacing);
  algoOptions['elk.spacing.edgeNode'] = String(Math.max(30, spacing / 2));
  if (algorithm === 'layered') {
    algoOptions['elk.layered.spacing.nodeNodeBetweenLayers'] = String(spacing + 60);
    algoOptions['elk.layered.spacing.edgeNodeBetweenLayers'] = String(Math.max(40, spacing / 2));
  }

  const children = sortedTables.map(table => {
    const d = degrees[table.id] || { in: 0, out: 0, total: 0 };
    const width = table.width || 260;
    const height = estimateTableHeight(table);

    const node = { id: table.id, width, height };

    if (algorithm === 'layered' && d.in > 3) {
      node.layoutOptions = {
        'elk.layered.priority.direction': String(d.in),
      };
    }

    return node;
  });

  const needsAcyclic = algorithm === 'radial' || algorithm === 'mrtree';
  let filteredRels = relationships;
  if (needsAcyclic) {
    filteredRels = buildSpanningTree(relationships, sortedTables);
  }

  const edges = filteredRels.map(r => ({
    id: r.id,
    sources: [r.fromTable],
    targets: [r.toTable],
  }));

  const graph = {
    id: 'root',
    layoutOptions: algoOptions,
    children,
    edges,
  };

  const layoutResult = await elk.layout(graph);

  // Extract node positions
  const positions = {};
  if (layoutResult.children) {
    layoutResult.children.forEach(node => {
      positions[node.id] = { x: node.x, y: node.y };
    });
  }

  // Extract edge routes (bend points) from ELK
  const edgeRoutes = {};
  if (layoutResult.edges) {
    layoutResult.edges.forEach(edge => {
      if (edge.sections && edge.sections.length > 0) {
        const section = edge.sections[0];
        const points = [];
        if (section.startPoint) points.push(section.startPoint);
        if (section.bendPoints) points.push(...section.bendPoints);
        if (section.endPoint) points.push(section.endPoint);
        if (points.length >= 2) {
          edgeRoutes[edge.id] = points;
        }
      }
    });
  }

  return { positions, edgeRoutes };
}

// ── Sugiyama-style "Clean" layout: minimal crossings ──

export function computeCleanLayout(tables, relationships, options = {}) {
  const { direction = 'LR', spacing = 80 } = options;
  if (tables.length === 0) return { positions: {}, edgeRoutes: {} };

  const tableMap = {};
  tables.forEach(t => { tableMap[t.id] = t; });

  // Build dependency graph: fromTable depends on toTable (fromTable has the FK)
  // For layout: toTable is parent, fromTable is child
  const parentOf = {}; // childId → Set<parentId>
  const childOf = {};  // parentId → Set<childId>
  tables.forEach(t => { parentOf[t.id] = new Set(); childOf[t.id] = new Set(); });

  relationships.forEach(r => {
    if (tableMap[r.fromTable] && tableMap[r.toTable]) {
      parentOf[r.fromTable].add(r.toTable);
      childOf[r.toTable].add(r.fromTable);
    }
  });

  // Step 1: Layer assignment via longest-path from roots
  const layers = assignLayers(tables, parentOf);

  // Step 2: Crossing minimization (barycenter heuristic, multiple passes)
  minimizeCrossings(layers, parentOf, childOf, 24);

  // Step 3: Position assignment
  const isVertical = direction === 'TB' || direction === 'BT';
  const positions = assignPositions(layers, tableMap, spacing, isVertical, direction);

  return { positions, edgeRoutes: {} };
}

function assignLayers(tables, parentOf) {
  const tableIds = tables.map(t => t.id);
  const layer = {};

  // Compute longest path from roots (tables with no parents)
  const memo = {};
  function longestPath(id) {
    if (memo[id] !== undefined) return memo[id];
    if (parentOf[id].size === 0) return (memo[id] = 0);
    let maxP = 0;
    for (const pid of parentOf[id]) {
      maxP = Math.max(maxP, longestPath(pid) + 1);
    }
    return (memo[id] = maxP);
  }

  // Handle cycles: detect and break them
  const visiting = new Set();
  const visited = new Set();
  function hasCycle(id) {
    if (visited.has(id)) return false;
    if (visiting.has(id)) return true;
    visiting.add(id);
    const toRemove = [];
    for (const pid of parentOf[id]) {
      if (hasCycle(pid)) {
        toRemove.push(pid);
      }
    }
    toRemove.forEach(pid => parentOf[id].delete(pid));
    visiting.delete(id);
    visited.add(id);
    return false;
  }
  tableIds.forEach(id => hasCycle(id));

  tableIds.forEach(id => { layer[id] = longestPath(id); });

  // Group by layer
  const maxLayer = Math.max(0, ...Object.values(layer));
  const layers = [];
  for (let i = 0; i <= maxLayer; i++) layers.push([]);
  tableIds.forEach(id => layers[layer[id]].push(id));

  return layers;
}

function countCrossings(layerA, layerB, childOf) {
  // Count crossings between two adjacent layers
  // For each pair of edges (a1→b1, a2→b2), they cross if a1<a2 but b1>b2 (or vice versa)
  const posA = {};
  layerA.forEach((id, i) => { posA[id] = i; });
  const posB = {};
  layerB.forEach((id, i) => { posB[id] = i; });

  // Collect edges from layerA to layerB
  const edges = [];
  layerA.forEach(aId => {
    if (childOf[aId]) {
      for (const bId of childOf[aId]) {
        if (posB[bId] !== undefined) {
          edges.push([posA[aId], posB[bId]]);
        }
      }
    }
  });

  let crossings = 0;
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const [a1, b1] = edges[i];
      const [a2, b2] = edges[j];
      if ((a1 < a2 && b1 > b2) || (a1 > a2 && b1 < b2)) crossings++;
    }
  }
  return crossings;
}

function minimizeCrossings(layers, parentOf, childOf, iterations) {
  for (let iter = 0; iter < iterations; iter++) {
    // Forward sweep (top to bottom)
    for (let i = 1; i < layers.length; i++) {
      reorderByBarycenter(layers[i], layers[i - 1], parentOf);
    }
    // Backward sweep (bottom to top)
    for (let i = layers.length - 2; i >= 0; i--) {
      reorderByBarycenter(layers[i], layers[i + 1], childOf);
    }
  }
}

function reorderByBarycenter(layer, adjacentLayer, connMap) {
  // connMap: for each node in layer, connMap[node] gives the set of connected nodes in adjacentLayer
  const adjPos = {};
  adjacentLayer.forEach((id, i) => { adjPos[id] = i; });

  const barycenters = layer.map(id => {
    const connected = connMap[id];
    if (!connected || connected.size === 0) return { id, bc: Infinity };
    let sum = 0, count = 0;
    for (const cid of connected) {
      if (adjPos[cid] !== undefined) {
        sum += adjPos[cid];
        count++;
      }
    }
    return { id, bc: count > 0 ? sum / count : Infinity };
  });

  // Sort by barycenter, keeping unconnected nodes in place
  barycenters.sort((a, b) => a.bc - b.bc);
  barycenters.forEach((item, i) => { layer[i] = item.id; });
}

function assignPositions(layers, tableMap, spacing, isVertical, direction) {
  const positions = {};
  const reversed = direction === 'BT' || direction === 'RL';

  // Process layers in display order (reversed flips the order)
  const orderedLayers = reversed ? [...layers].reverse() : layers;

  let primaryOffset = 50;
  for (let li = 0; li < orderedLayers.length; li++) {
    const layer = orderedLayers[li];

    let maxPrimaryDim = 0;
    const sizes = layer.map(id => {
      const t = tableMap[id];
      const w = t.width || 260;
      const h = estimateTableHeight(t);
      maxPrimaryDim = Math.max(maxPrimaryDim, isVertical ? h : w);
      return { id, w, h };
    });

    let secondaryOffset = 50;
    for (const { id, w, h } of sizes) {
      if (isVertical) {
        positions[id] = { x: secondaryOffset, y: primaryOffset };
        secondaryOffset += w + spacing;
      } else {
        positions[id] = { x: primaryOffset, y: secondaryOffset };
        secondaryOffset += h + spacing;
      }
    }

    // Advance by the widest/tallest node in this layer + gap
    primaryOffset += maxPrimaryDim + spacing;
  }

  return positions;
}

export function computeGridLayout(tables, { hSpacing = 60, vSpacing = 60 } = {}) {
  if (tables.length === 0) return {};
  const cols = Math.ceil(Math.sqrt(tables.length));

  // Compute per-row max height for a clean grid
  const rowHeights = [];
  for (let i = 0; i < tables.length; i++) {
    const row = Math.floor(i / cols);
    const h = estimateTableHeight(tables[i]);
    rowHeights[row] = Math.max(rowHeights[row] || 0, h);
  }

  const positions = {};
  let yOffset = 50;
  for (let i = 0; i < tables.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    if (col === 0 && row > 0) {
      yOffset += rowHeights[row - 1] + vSpacing;
    }
    const w = tables[i].width || 260;
    positions[tables[i].id] = {
      x: col * (w + hSpacing) + 50,
      y: yOffset,
    };
  }
  return positions;
}
