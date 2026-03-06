import { useState, useCallback, useEffect, useRef } from 'react';
import { X, LayoutGrid, ArrowDown, ArrowRight, ArrowUp, ArrowLeft, Loader2 } from 'lucide-react';
import useStore from '../../store/useStore';
import { computeAutoLayout, computeGridLayout, LAYOUT_ALGORITHMS, LAYOUT_DIRECTIONS } from '../../utils/autoLayout';

const directionIcons = {
  TB: ArrowDown,
  LR: ArrowRight,
  BT: ArrowUp,
  RL: ArrowLeft,
};

export default function AutoLayoutModal({ onClose }) {
  const tables = useStore(s => s.tables);
  const relationships = useStore(s => s.relationships);
  const applyAutoLayout = useStore(s => s.applyAutoLayout);
  const setLivePositions = useStore(s => s.setLivePositions);
  const layoutConfig = useStore(s => s.layoutConfig);
  const setLayoutConfig = useStore(s => s.setLayoutConfig);

  const [algorithm, setAlgorithmState] = useState(layoutConfig.algorithm);
  const [direction, setDirectionState] = useState(layoutConfig.direction);
  const [spacing, setSpacingState] = useState(layoutConfig.spacing);
  const [hSpacing, setHSpacingState] = useState(layoutConfig.hSpacing);
  const [vSpacing, setVSpacingState] = useState(layoutConfig.vSpacing);
  const [hubCenter, setHubCenterState] = useState(layoutConfig.hubCenter);
  const [isRunning, setIsRunning] = useState(false);

  const [showDone, setShowDone] = useState(false);
  const gridApplied = useRef(false);
  const hasMounted = useRef(false);
  const lastPositions = useRef(null);
  const rafId = useRef(0);
  const tablesRef = useRef(tables);
  tablesRef.current = tables;

  // Persist config to store on every change
  const setAlgorithm = (v) => { setAlgorithmState(v); setLayoutConfig({ algorithm: v }); };
  const setDirection = (v) => { setDirectionState(v); setLayoutConfig({ direction: v }); };
  const setHubCenter = (v) => { setHubCenterState(v); setLayoutConfig({ hubCenter: v }); };

  const setHSpacing = (v) => { setHSpacingState(v); setLayoutConfig({ hSpacing: v }); };
  const setVSpacing = (v) => { setVSpacingState(v); setLayoutConfig({ vSpacing: v }); };

  // Clean up live positions on unmount
  useEffect(() => () => setLivePositions(null), []);

  const handleGeneralSpacing = (val) => {
    setSpacingState(val);
    setHSpacingState(val);
    setVSpacingState(val);
    setLayoutConfig({ spacing: val, hSpacing: val, vSpacing: val });
  };

  // Live preview: position-only update via store → Canvas updates nodes without re-rendering TableNode
  useEffect(() => {
    if (algorithm !== 'grid' || tablesRef.current.length === 0) return;
    if (!hasMounted.current) { hasMounted.current = true; return; }

    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const positions = computeGridLayout(tablesRef.current, { hSpacing, vSpacing });
      lastPositions.current = positions;
      setLivePositions(positions);
      if (!gridApplied.current) {
        gridApplied.current = true;
        setShowDone(true);
      }
    });

    return () => cancelAnimationFrame(rafId.current);
  }, [algorithm, hSpacing, vSpacing]);

  const handleDone = useCallback(() => {
    setLivePositions(null);
    if (gridApplied.current && lastPositions.current) {
      applyAutoLayout(lastPositions.current, {});
    }
    onClose();
  }, [applyAutoLayout, setLivePositions, onClose]);

  const handleCancel = useCallback(() => {
    setLivePositions(null); // Canvas resyncs from store → original positions
    onClose();
  }, [setLivePositions, onClose]);

  const handleApply = useCallback(async () => {
    if (tables.length === 0) return;

    if (algorithm === 'grid') {
      handleDone();
      return;
    }

    setIsRunning(true);
    try {
      const result = await computeAutoLayout(tables, relationships, {
        algorithm,
        direction,
        spacing,
        hubCenter,
      });
      applyAutoLayout(result.positions, result.edgeRoutes);
      onClose();
    } catch (err) {
      console.error('Auto-layout failed:', err);
      alert('Layout failed: ' + err.message);
    } finally {
      setIsRunning(false);
    }
  }, [tables, relationships, algorithm, direction, spacing, hubCenter, applyAutoLayout, onClose, handleDone]);

  const showDirection = algorithm === 'layered' || algorithm === 'mrtree';
  const isGrid = algorithm === 'grid';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          width: 420,
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LayoutGrid size={18} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
              Auto Layout
            </span>
          </div>
          <button
            onClick={handleCancel}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Algorithm */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
              Algorithm
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {LAYOUT_ALGORITHMS.map(algo => (
                <button
                  key={algo.id}
                  onClick={() => setAlgorithm(algo.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    border: `1px solid ${algorithm === algo.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 6,
                    background: algorithm === algo.id ? 'rgba(99,102,241,0.1)' : 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: 13,
                    textAlign: 'left',
                    transition: 'all 0.1s',
                  }}
                >
                  <span style={{ fontWeight: algorithm === algo.id ? 600 : 400 }}>{algo.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{algo.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Direction */}
          {showDirection && (
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                Direction
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {LAYOUT_DIRECTIONS.map(dir => {
                  const Icon = directionIcons[dir.id];
                  return (
                    <button
                      key={dir.id}
                      onClick={() => setDirection(dir.id)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        padding: '8px 6px',
                        border: `1px solid ${direction === dir.id ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 6,
                        background: direction === dir.id ? 'rgba(99,102,241,0.1)' : 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: 11,
                        transition: 'all 0.1s',
                      }}
                    >
                      <Icon size={14} />
                      {dir.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spacing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span>General {isGrid && <span style={{ color: 'var(--accent)', fontSize: 10 }}>(live)</span>}</span>
                <span style={{ color: 'var(--text-primary)' }}>{spacing}px</span>
              </label>
              <input
                type="range"
                min={20}
                max={200}
                value={spacing}
                onChange={e => handleGeneralSpacing(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>
            {isGrid && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Horizontal</span>
                    <span style={{ color: 'var(--text-primary)' }}>{hSpacing}px</span>
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={300}
                    value={hSpacing}
                    onChange={e => setHSpacing(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Vertical</span>
                    <span style={{ color: 'var(--text-primary)' }}>{vSpacing}px</span>
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={300}
                    value={vSpacing}
                    onChange={e => setVSpacing(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Hub center option */}
          {!isGrid && (
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--text-primary)',
            }}>
              <input
                type="checkbox"
                checked={hubCenter}
                onChange={e => setHubCenter(e.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              Prioritize hub tables (most referenced at top/center)
            </label>
          )}

          {/* Info */}
          <div style={{
            padding: '8px 12px',
            background: 'rgba(99,102,241,0.08)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}>
            {tables.length} tables, {relationships.length} relationships
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
        }}>
          {isGrid && showDone ? (
            <>
              <button
                onClick={handleCancel}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: 6,
                  background: 'var(--accent)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Done
              </button>
            </>
          ) : (
            <button
              onClick={isGrid ? onClose : handleCancel}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Cancel
            </button>
          )}
          {!isGrid && (
            <button
              onClick={handleApply}
              disabled={isRunning || tables.length === 0}
              style={{
                padding: '8px 20px',
                border: 'none',
                borderRadius: 6,
                background: isRunning ? 'var(--bg-tertiary)' : 'var(--accent)',
                color: '#fff',
                cursor: isRunning ? 'wait' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: tables.length === 0 ? 0.5 : 1,
              }}
            >
              {isRunning && <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />}
              {isRunning ? 'Computing...' : 'Apply Layout'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
