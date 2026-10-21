'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const PALETTE = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#14b8a6',
];

const PRESETS = ['EVERY BIT COUNTS', 'HELLO WORLD'];

// ==============================================================================
// Pure Huffman DSA Step Generator
// ==============================================================================
function buildHuffmanModel(rawText) {
  const text = (rawText || '').trim().slice(0, 24);
  if (!text) return null;

  // 1. Frequency calculation
  const freqMap = {};
  for (const ch of text) {
    freqMap[ch] = (freqMap[ch] || 0) + 1;
  }

  // 2. Leaf nodes
  const sortedEntries = Object.entries(freqMap).sort((a, b) => {
    if (a[1] !== b[1]) return a[1] - b[1];
    return a[0].localeCompare(b[0]);
  });

  let nextId = 1;
  let forest = sortedEntries.map(([ch, count], idx) => ({
    id: nextId++,
    ch,
    count,
    color: PALETTE[idx % PALETTE.length],
    left: null,
    right: null,
    isLeaf: true,
  }));

  const initialLeaves = [...forest];
  const merges = [];

  if (forest.length === 1) {
    const single = forest[0];
    const root = {
      id: nextId++,
      ch: null,
      count: single.count,
      left: single,
      right: null,
      isLeaf: false,
    };
    merges.push({
      leftId: single.id,
      rightId: null,
      parentId: root.id,
      parent: root,
      visibleNodeIds: new Set([single.id, root.id]),
      visibleEdgeKeys: new Set([`${root.id}-${single.id}`]),
    });
    forest = [root];
  } else {
    const visibleNodes = new Set(initialLeaves.map(l => l.id));
    const visibleEdges = new Set();

    while (forest.length > 1) {
      forest.sort((a, b) => a.count - b.count || a.id - b.id);
      const left = forest.shift();
      const right = forest.shift();

      const parent = {
        id: nextId++,
        ch: null,
        count: left.count + right.count,
        left,
        right,
        isLeaf: false,
      };

      forest.push(parent);
      visibleNodes.add(parent.id);
      visibleEdges.add(`${parent.id}-${left.id}`);
      visibleEdges.add(`${parent.id}-${right.id}`);

      merges.push({
        leftId: left.id,
        rightId: right.id,
        parentId: parent.id,
        parent,
        visibleNodeIds: new Set(visibleNodes),
        visibleEdgeKeys: new Set(visibleEdges),
      });
    }
  }

  const root = forest[0];

  // 3. Prefix codes DFS
  const codeMap = {};
  function dfs(node, path) {
    if (!node) return;
    if (node.isLeaf) {
      codeMap[node.ch] = path || '0';
      return;
    }
    if (node.left) dfs(node.left, path + '0');
    if (node.right) dfs(node.right, path + '1');
  }
  dfs(root, '');

  // 4. Bitstream statistics
  let encodedBits = '';
  for (const ch of text) {
    encodedBits += codeMap[ch] || '';
  }
  const rawBits = text.length * 8;
  const compressedBits = encodedBits.length;
  const savedPct = rawBits > 0 ? Math.round(((rawBits - compressedBits) / rawBits) * 100) : 0;

  return {
    text,
    freqMap,
    initialLeaves,
    merges,
    root,
    codeMap,
    encodedBits,
    rawBits,
    compressedBits,
    savedPct,
  };
}

// Compute SVG coordinate layout for the final tree
function layoutTree(root) {
  if (!root) return { nodes: [], edges: [], width: 400, height: 260 };

  const positions = new Map();
  let leafIndex = 0;
  let maxDepth = 0;

  function assignLeafX(node, depth) {
    if (!node) return;
    maxDepth = Math.max(maxDepth, depth);
    if (node.isLeaf) {
      positions.set(node.id, { x: leafIndex++, depth });
      return;
    }
    assignLeafX(node.left, depth + 1);
    assignLeafX(node.right, depth + 1);
    const leftPos = positions.get(node.left?.id);
    const rightPos = positions.get(node.right?.id);
    const midX = leftPos && rightPos ? (leftPos.x + rightPos.x) / 2 : (leftPos?.x ?? rightPos?.x ?? 0);
    positions.set(node.id, { x: midX, depth });
  }
  assignLeafX(root, 0);

  const NODE_R = 20;
  const LEVEL_H = 72;
  const COL_W = 58;
  const PAD_X = 32;
  const PAD_Y = 30;

  const totalWidth = Math.max(PAD_X * 2 + leafIndex * COL_W, 360);
  const totalHeight = PAD_Y * 2 + maxDepth * LEVEL_H + NODE_R * 2;

  const nodes = [];
  const edges = [];

  function collect(node) {
    if (!node) return;
    const pos = positions.get(node.id);
    const cx = PAD_X + pos.x * COL_W + COL_W / 2;
    const cy = PAD_Y + pos.depth * LEVEL_H + NODE_R;

    nodes.push({
      id: node.id,
      ch: node.ch,
      count: node.count,
      isLeaf: node.isLeaf,
      color: node.color,
      cx,
      cy,
    });

    if (node.left) {
      const leftPos = positions.get(node.left.id);
      const lcx = PAD_X + leftPos.x * COL_W + COL_W / 2;
      const lcy = PAD_Y + leftPos.depth * LEVEL_H + NODE_R;
      edges.push({
        key: `${node.id}-${node.left.id}`,
        fromId: node.id,
        toId: node.left.id,
        x1: cx,
        y1: cy + NODE_R,
        x2: lcx,
        y2: lcy - NODE_R,
        bit: '0',
        midX: (cx + lcx) / 2 - 8,
        midY: (cy + lcy) / 2,
      });
      collect(node.left);
    }

    if (node.right) {
      const rightPos = positions.get(node.right.id);
      const rcx = PAD_X + rightPos.x * COL_W + COL_W / 2;
      const rcy = PAD_Y + rightPos.depth * LEVEL_H + NODE_R;
      edges.push({
        key: `${node.id}-${node.right.id}`,
        fromId: node.id,
        toId: node.right.id,
        x1: cx,
        y1: cy + NODE_R,
        x2: rcx,
        y2: rcy - NODE_R,
        bit: '1',
        midX: (cx + rcx) / 2 + 8,
        midY: (cy + rcy) / 2,
      });
      collect(node.right);
    }
  }
  collect(root);

  return { nodes, edges, width: totalWidth, height: totalHeight };
}

// ==============================================================================
// Interactive Animations Component (Side-by-Side Dashboard Layout)
// ==============================================================================
export default function AnimationsPage() {
  const [inputVal, setInputVal] = useState('EVERY BIT COUNTS');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1); // 1x or 2x

  const model = useMemo(() => buildHuffmanModel(inputVal), [inputVal]);
  const totalSteps = useMemo(() => (model ? model.merges.length : 0), [model]);

  // Tree layout geometry
  const layout = useMemo(() => {
    if (!model || !model.root) return null;
    return layoutTree(model.root);
  }, [model]);

  // Reset step when text changes
  useEffect(() => {
    setCurrentStep(totalSteps);
    setIsPlaying(false);
  }, [totalSteps]);

  // Autoplay ticker
  useEffect(() => {
    if (!isPlaying) return;
    const intervalTime = 1200 / playSpeed;
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= totalSteps) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isPlaying, playSpeed, totalSteps]);

  // Determine which nodes and edges are visible at current step
  const activeVisibility = useMemo(() => {
    if (!model) return { nodeIds: new Set(), edgeKeys: new Set() };
    if (currentStep === 0) {
      return {
        nodeIds: new Set(model.initialLeaves.map(l => l.id)),
        edgeKeys: new Set(),
      };
    }
    const stepIdx = Math.min(currentStep - 1, model.merges.length - 1);
    const m = model.merges[stepIdx];
    return {
      nodeIds: m.visibleNodeIds,
      edgeKeys: m.visibleEdgeKeys,
    };
  }, [model, currentStep]);

  return (
    <main className={styles.page}>
      {/* Top Header Bar */}
      <div className={styles.topBar}>
        <div>
          <p className={styles.kicker}>HUFFX • VISUALIZER</p>
          <h1 className={styles.title}>Watch Huffman Think.</h1>
        </div>
        <Link href="/" className={styles.backBtn}>
          ← Return to Workspace
        </Link>
      </div>

      {/* Main Two-Column Side-by-Side Dashboard */}
      {model && (
        <div className={styles.dashboardGrid}>
          {/* LEFT COLUMN: Controls, Frequencies, Codebook, and Bitstream */}
          <div className={styles.leftCol}>
            {/* 1. Input & Presets */}
            <div className={styles.card}>
              <div className={styles.inputWrap}>
                <label htmlFor="textInput" className={styles.label}>TEST TEXT (MAX 24 CHARS)</label>
                <input
                  id="textInput"
                  type="text"
                  className={styles.textInput}
                  value={inputVal}
                  maxLength={24}
                  onChange={e => setInputVal(e.target.value.toUpperCase())}
                  placeholder="TYPE A WORD OR PHRASE"
                />
              </div>

              {/* Presets */}
              <div className={styles.presetRow}>
                <span className={styles.presetLabel}>Preset:</span>
                {PRESETS.map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`${styles.presetBtn} ${inputVal === p ? styles.presetActive : ''}`}
                    onClick={() => setInputVal(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Frequencies */}
              <div className={styles.freqRow}>
                {Object.entries(model.freqMap).map(([ch, count], i) => (
                  <div key={ch} className={styles.freqPill}>
                    <span className={styles.freqChar} style={{ color: PALETTE[i % PALETTE.length] }}>
                      {ch === ' ' ? '␣' : ch}
                    </span>
                    <span className={styles.freqCount}>×{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Step Controller Bar */}
            <div className={styles.card}>
              <div className={styles.stepHeader}>
                <span className={styles.stepBadge}>
                  {currentStep === 0
                    ? 'Step 0: Initial Min-Heap Leaves'
                    : currentStep === totalSteps
                      ? 'Complete: Full Tree Built ✓'
                      : `Merge Step ${currentStep} of ${totalSteps}`}
                </span>
                <button
                  type="button"
                  className={styles.speedBtn}
                  onClick={() => setPlaySpeed(s => (s === 1 ? 2 : 1))}
                  title="Toggle animation speed"
                >
                  {playSpeed}× Speed
                </button>
              </div>

              <div className={styles.stepControls}>
                <button
                  type="button"
                  className={styles.ctrlBtn}
                  onClick={() => { setIsPlaying(false); setCurrentStep(0); }}
                  title="Reset to initial leaves"
                >
                  ⏮ Start
                </button>
                <button
                  type="button"
                  className={styles.ctrlBtn}
                  onClick={() => { setIsPlaying(false); setCurrentStep(s => Math.max(0, s - 1)); }}
                  disabled={currentStep === 0}
                  title="Previous merge step"
                >
                  ◀ Prev
                </button>
                <button
                  type="button"
                  className={`${styles.ctrlBtn} ${styles.ctrlPrimary}`}
                  onClick={() => {
                    if (currentStep >= totalSteps) setCurrentStep(0);
                    setIsPlaying(!isPlaying);
                  }}
                >
                  {isPlaying ? '⏸ Pause' : currentStep >= totalSteps ? '↺ Replay' : '▶ Play'}
                </button>
                <button
                  type="button"
                  className={styles.ctrlBtn}
                  onClick={() => { setIsPlaying(false); setCurrentStep(s => Math.min(totalSteps, s + 1)); }}
                  disabled={currentStep >= totalSteps}
                  title="Next merge step"
                >
                  Next ▶
                </button>
              </div>

              <p className={styles.stepDesc}>
                {currentStep === 0
                  ? 'All unique symbols initialised in priority queue leaf nodes.'
                  : currentStep === totalSteps
                    ? 'Complete binary prefix tree constructed. Left = 0, Right = 1.'
                    : `Merged lightest nodes into parent #${model.merges[currentStep - 1]?.parentId} (sum freq: ${model.merges[currentStep - 1]?.parent?.count}).`}
              </p>
            </div>

            {/* 3. Codebook Table */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>PREFIX CODEBOOK TABLE</span>
                <span className={styles.cardBadge}>Prefix-Free ✓</span>
              </div>
              <div className={styles.tableScroll}>
                <table className={styles.codesTable}>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Freq</th>
                      <th>Huffman Code</th>
                      <th>Bits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(model.codeMap).map(([sym, code], idx) => (
                      <tr key={sym}>
                        <td>
                          <span className={styles.symDot} style={{ background: PALETTE[idx % PALETTE.length] }} />
                          <b style={{ color: PALETTE[idx % PALETTE.length] }}>{sym === ' ' ? 'SPACE' : sym}</b>
                        </td>
                        <td className={styles.monoCol}>×{model.freqMap[sym]}</td>
                        <td className={styles.monoCol}>
                          <code className={styles.codePill} style={{ color: PALETTE[idx % PALETTE.length] }}>
                            {code}
                          </code>
                        </td>
                        <td className={styles.monoCol}>{code.length}b</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Bitstream & Comparison Banner */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>PACKED BITSTREAM</span>
                <span className={styles.cardBadgeGood}>{model.savedPct}% Saved</span>
              </div>

              <div className={styles.bitstreamWrap}>
                {model.text.split('').map((ch, i) => (
                  <span
                    key={i}
                    className={styles.bitToken}
                    style={{
                      color: PALETTE[Object.keys(model.freqMap).indexOf(ch) % PALETTE.length],
                      borderBottom: `2px solid ${PALETTE[Object.keys(model.freqMap).indexOf(ch) % PALETTE.length]}`,
                    }}
                    title={`${ch}: ${model.codeMap[ch]}`}
                  >
                    {model.codeMap[ch]}
                  </span>
                ))}
              </div>

              <div className={styles.compareBanner}>
                <div className={styles.compareItem}>
                  <span className={styles.cLabel}>RAW ASCII</span>
                  <span className={styles.cVal}>{model.rawBits} <small>bits</small></span>
                </div>
                <div className={styles.compareArrow}>➔</div>
                <div className={styles.compareItem}>
                  <span className={styles.cLabel}>HUFFMAN PACKED</span>
                  <span className={styles.cValGood}>{model.compressedBits} <small>bits</small></span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Binary Tree Stage */}
          <div className={styles.rightCol}>
            <div className={styles.treeCard}>
              <div className={styles.treeHeader}>
                <div>
                  <span className={styles.treeTitle}>HUFFMAN BINARY TREE STAGE</span>
                  <span className={styles.treeSub}>
                    {activeVisibility.nodeIds.size} nodes · {activeVisibility.edgeKeys.size} edges visible
                  </span>
                </div>
                <span className={styles.treeHint}>0 = Left · 1 = Right</span>
              </div>

              <div className={styles.treeContainer}>
                {layout && (
                  <svg
                    viewBox={`0 0 ${layout.width} ${layout.height}`}
                    className={styles.treeSvg}
                    role="img"
                    aria-label="Interactive Huffman Binary Tree"
                  >
                    {/* Edges */}
                    {layout.edges.map(e => {
                      const isVisible = activeVisibility.edgeKeys.has(e.key);
                      return (
                        <g key={e.key} className={styles.edgeGroup} opacity={isVisible ? 1 : 0.08}>
                          <line
                            x1={e.x1}
                            y1={e.y1}
                            x2={e.x2}
                            y2={e.y2}
                            className={styles.treeEdge}
                          />
                          <circle cx={e.midX} cy={e.midY} r="8.5" className={styles.edgeBadgeBg} />
                          <text x={e.midX} y={e.midY + 3.5} className={styles.edgeBitText}>
                            {e.bit}
                          </text>
                        </g>
                      );
                    })}

                    {/* Nodes */}
                    {layout.nodes.map(n => {
                      const isVisible = activeVisibility.nodeIds.has(n.id);
                      return (
                        <g
                          key={n.id}
                          className={`${styles.treeNode} ${n.isLeaf ? styles.nodeLeaf : styles.nodeInternal}`}
                          transform={`translate(${n.cx}, ${n.cy})`}
                          opacity={isVisible ? 1 : 0.08}
                        >
                          <circle
                            r="20"
                            className={styles.nodeCircle}
                            style={{
                              stroke: n.isLeaf ? n.color : '#111114',
                              fill: n.isLeaf ? '#ffffff' : '#f8fafc',
                            }}
                          />
                          {n.isLeaf ? (
                            <>
                              <text y="4" className={styles.nodeChar} fill={n.color}>
                                {n.ch === ' ' ? '␣' : n.ch}
                              </text>
                              <text y="30" className={styles.nodeSubFreq}>
                                ×{n.count}
                              </text>
                            </>
                          ) : (
                            <text y="4" className={styles.nodeFreq} fill="#111114">
                              {n.count}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
