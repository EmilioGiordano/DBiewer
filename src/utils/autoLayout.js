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

// Compute in-degree, out-degree for smart ordering
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

// Layout algorithm configs
const ALGORITHM_OPTIONS = {
  layered: {
    'elk.algorithm': 'layered',
    'elk.layered.spacing.nodeNodeBetweenLayers': '80',
    'elk.layered.spacing.edgeNodeBetweenLayers': '40',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    'elk.layered.thoroughness': '10',
    'elk.edgeRouting': 'ORTHOGONAL',
  },
  stress: {
    'elk.algorithm': 'stress',
    'elk.stress.desiredEdgeLength': '200',
  },
  mrtree: {
    'elk.algorithm': 'mrtree',
    'elk.mrtree.spacing.nodeNode': '40',
  },
  radial: {
    'elk.algorithm': 'radial',
    'elk.radial.radius': '200',
  },
  force: {
    'elk.algorithm': 'force',
    'elk.force.iterations': '300',
    'elk.force.repulsion': '20',
  },
};

const DIRECTION_MAP = {
  TB: 'DOWN',
  BT: 'UP',
  LR: 'RIGHT',
  RL: 'LEFT',
};

export const LAYOUT_ALGORITHMS = [
  { id: 'layered', label: 'Hierarchical', description: 'Layered layout, ideal for ER diagrams' },
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

export async function computeAutoLayout(tables, relationships, options = {}) {
  const {
    algorithm = 'layered',
    direction = 'TB',
    spacing = 60,
    hubCenter = false,
  } = options;

  if (tables.length === 0) return {};

  const degrees = computeDegrees(tables, relationships);

  // For radial + hubCenter: find the most connected table and put it as root
  let sortedTables = [...tables];
  if ((algorithm === 'radial' || hubCenter) && relationships.length > 0) {
    sortedTables.sort((a, b) => degrees[b.id].total - degrees[a.id].total);
  }

  const algoOptions = { ...ALGORITHM_OPTIONS[algorithm] } || ALGORITHM_OPTIONS.layered;

  // Direction only applies to layered and mrtree
  if (algorithm === 'layered' || algorithm === 'mrtree') {
    algoOptions['elk.direction'] = DIRECTION_MAP[direction] || 'DOWN';
  }

  // Apply spacing
  algoOptions['elk.spacing.nodeNode'] = String(spacing);
  if (algorithm === 'layered') {
    algoOptions['elk.layered.spacing.nodeNodeBetweenLayers'] = String(spacing + 40);
  }

  // Priority for hub tables in layered layout
  const children = sortedTables.map(table => {
    const d = degrees[table.id] || { in: 0, out: 0, total: 0 };
    const width = table.width || 260;
    const height = estimateTableHeight(table);

    const node = {
      id: table.id,
      width,
      height,
    };

    // In layered mode, give hub tables higher priority to place them in upper layers
    if (algorithm === 'layered' && d.in > 3) {
      node.layoutOptions = {
        'elk.layered.priority.direction': String(d.in),
      };
    }

    return node;
  });

  // Build edges from relationships
  const edges = relationships.map(r => ({
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

  // Convert ELK result to position map
  const positions = {};
  if (layoutResult.children) {
    layoutResult.children.forEach(node => {
      positions[node.id] = { x: node.x, y: node.y };
    });
  }

  return positions;
}
