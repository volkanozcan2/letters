import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { RefreshCw, Maximize, Minimize } from 'lucide-react';

interface GridItem {
  id: string;
  letter: string;
  bgColor: string;
  fgColor: string;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const getRandomLetter = () => LETTERS[Math.floor(Math.random() * LETTERS.length)];

const getRandomHexColor = () => {
  const hex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  return `#${hex}`;
};

/**
 * Calculates a high-contrast complementary color.
 * For very dark or very light colors, simple inversion might yield low contrast.
 * This version ensures a visible difference.
 */
const getComplementaryColor = (hex: string) => {
  const color = hex.replace('#', '');
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  
  // Basic inversion
  let compR = 255 - r;
  let compG = 255 - g;
  let compB = 255 - b;

  // Boost contrast if the result is too "gray" or close to the original
  const brightnessOriginal = (r * 299 + g * 587 + b * 114) / 1000;
  const brightnessComp = (compR * 299 + compG * 587 + compB * 114) / 1000;

  if (Math.abs(brightnessOriginal - brightnessComp) < 50) {
    if (brightnessOriginal > 128) {
      compR = Math.max(0, r - 150);
      compG = Math.max(0, g - 150);
      compB = Math.max(0, b - 150);
    } else {
      compR = Math.min(255, r + 150);
      compG = Math.min(255, g + 150);
      compB = Math.min(255, b + 150);
    }
  }
  
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(compR)}${toHex(compG)}${toHex(compB)}`;
};

const ChromaGrid: React.FC = () => {
  const [items, setItems] = useState<GridItem[]>([]);
  const [gridConfig, setGridConfig] = useState({ cols: 0, rows: 0, cellSize: 150 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const calculateGrid = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // We want relatively large squares, approx 150px
    const targetSize = 160;
    const cols = Math.ceil(width / targetSize);
    const cellSize = width / cols;
    const rows = Math.ceil(height / cellSize);
    
    setGridConfig({ cols, rows, cellSize });

    const total = cols * rows;
    const newItems: GridItem[] = Array.from({ length: total }, (_, i) => {
      const bgColor = getRandomHexColor();
      return {
        id: `${i}-${Math.random()}`,
        letter: getRandomLetter(),
        bgColor,
        fgColor: getComplementaryColor(bgColor),
      };
    });
    setItems(newItems);
  }, []);

  useEffect(() => {
    calculateGrid();
    window.addEventListener('resize', calculateGrid);
    return () => window.removeEventListener('resize', calculateGrid);
  }, [calculateGrid]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleCellClick = (index: number) => {
    setItems(prev => {
      const next = [...prev];
      const bgColor = getRandomHexColor();
      next[index] = {
        ...next[index],
        letter: getRandomLetter(),
        bgColor,
        fgColor: getComplementaryColor(bgColor),
      };
      return next;
    });
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
            className="letter-cell flex items-center justify-center cursor-pointer overflow-hidden border border-black/5"
            style={{ 
              backgroundColor: item.bgColor,
              color: item.fgColor,
            }}
          >
            <span 
              className="letter-text font-extrabold uppercase"
              style={{ 
                // FontSize slightly smaller than cell size to "nearly fill" it
                fontSize: `${gridConfig.cellSize * 0.9}px`,
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              {item.letter}
            </span>
          </div>
        ))}
      </div>

      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
        <button
          onClick={calculateGrid}
          className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white hover:bg-white/20 active:scale-90 transition-all shadow-2xl"
        >
          <RefreshCw size={28} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white hover:bg-white/20 active:scale-90 transition-all shadow-2xl"
        >
          {isFullscreen ? <Minimize size={28} /> : <Maximize size={28} />}
        </button>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<ChromaGrid />);
}