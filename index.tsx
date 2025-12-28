import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { RefreshCw, Maximize, Minimize } from 'lucide-react';

interface GridItem {
  id: string;
  letter: string;
  bgColor: string;
  fgColor: string;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PALETTE = ["#ffbe0b", "#fb5607", "#ff006e", "#8338ec", "#3a86ff"];

const getRandomLetter = () => LETTERS[Math.floor(Math.random() * LETTERS.length)];

const getUniqueColors = () => {
  const bgIndex = Math.floor(Math.random() * PALETTE.length);
  let fgIndex = Math.floor(Math.random() * PALETTE.length);
  while (fgIndex === bgIndex) {
    fgIndex = Math.floor(Math.random() * PALETTE.length);
  }
  return { bgColor: PALETTE[bgIndex], fgColor: PALETTE[fgIndex] };
};

const ChromaGrid: React.FC = () => {
  const [items, setItems] = useState<GridItem[]>([]);
  const [gridConfig, setGridConfig] = useState({ cols: 0, rows: 0, cellSize: 100 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Ref to track which indices are "fixed" (finished scrambling)
  const fixedIndicesRef = useRef<Set<number>>(new Set());
  const scrambleIntervalRef = useRef<number | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);

  const calculateGrid = useCallback(() => {
    // Cleanup previous animations
    if (scrambleIntervalRef.current) clearInterval(scrambleIntervalRef.current);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    fixedIndicesRef.current.clear();

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Target size for cells (smaller as requested)
    const targetSize = 110; 
    const cols = Math.ceil(width / targetSize);
    const cellSize = width / cols;
    const rows = Math.ceil(height / cellSize);
    
    setGridConfig({ cols, rows, cellSize });

    const total = cols * rows;
    const initialItems: GridItem[] = Array.from({ length: total }, (_, i) => {
      const { bgColor, fgColor } = getUniqueColors();
      return {
        id: `${i}-${Math.random()}`,
        letter: getRandomLetter(),
        bgColor,
        fgColor,
      };
    });
    setItems(initialItems);

    startScrambleAnimation(total);
  }, []);

  const startScrambleAnimation = (total: number) => {
    // 1. Scramble loop: every 50ms, update letters for all unfixed cells
    scrambleIntervalRef.current = window.setInterval(() => {
      setItems(prev => prev.map((item, idx) => {
        if (fixedIndicesRef.current.has(idx)) return item;
        const { bgColor, fgColor } = getUniqueColors();
        return {
          ...item,
          letter: getRandomLetter(),
          bgColor,
          fgColor,
        };
      }));
    }, 50);

    // 2. Reveal logic: start marking cells as "fixed" one by one
    const availableIndices = Array.from({ length: total }, (_, i) => i);
    // Shuffle available indices to reveal in random order
    for (let i = availableIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
    }

    let revealIdx = 0;
    const revealStep = () => {
      if (revealIdx >= availableIndices.length) {
        if (scrambleIntervalRef.current) clearInterval(scrambleIntervalRef.current);
        return;
      }

      // Mark this index as fixed
      fixedIndicesRef.current.add(availableIndices[revealIdx]);
      revealIdx++;

      // Adjust speed of reveal based on grid size
      const delay = Math.max(10, 2000 / total); 
      revealTimeoutRef.current = window.setTimeout(revealStep, delay);
    };

    // Wait a bit before starting the reveal sequence
    revealTimeoutRef.current = window.setTimeout(revealStep, 800);
  };

  useEffect(() => {
    calculateGrid();
    window.addEventListener('resize', calculateGrid);
    return () => {
      window.removeEventListener('resize', calculateGrid);
      if (scrambleIntervalRef.current) clearInterval(scrambleIntervalRef.current);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, [calculateGrid]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleCellClick = (index: number) => {
    // Manual click override: reset the cell and fix it immediately
    setItems(prev => {
      const next = [...prev];
      const { bgColor, fgColor } = getUniqueColors();
      next[index] = {
        ...next[index],
        letter: getRandomLetter(),
        bgColor,
        fgColor,
      };
      return next;
    });
    fixedIndicesRef.current.add(index);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      <div 
        className="grid w-full h-full"
        style={{
          gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
          gridAutoRows: `${gridConfig.cellSize}px`
        }}
      >
        {items.map((item, idx) => (
          <div
            key={item.id}
            onClick={() => handleCellClick(idx)}
            className="letter-cell flex items-center justify-center cursor-pointer overflow-hidden border border-black/10 hover:z-10"
            style={{ 
              backgroundColor: item.bgColor,
              color: item.fgColor,
            }}
          >
            <span 
              className="letter-text font-bold uppercase leading-none"
              style={{ 
                fontSize: `${gridConfig.cellSize * 0.7}px`,
                fontFamily: "'Gloria Hallelujah', cursive"
              }}
            >
              {item.letter}
            </span>
          </div>
        ))}
      </div>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        <button
          onClick={calculateGrid}
          className="p-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-black/60 active:scale-90 transition-all shadow-xl"
          aria-label="Regenerate/Reveal"
        >
          <RefreshCw size={24} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-black/60 active:scale-90 transition-all shadow-xl"
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<ChromaGrid />);
}
