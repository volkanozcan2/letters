import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { RefreshCw, Maximize, Minimize } from 'lucide-react';

interface GridItem {
  id: string;
  letter: string;
  bgColor: string;
  fgColor: string;
}

const PALETTE = ["ffbe0b", "fb5607", "ff006e", "8338ec", "3a86ff"];

const getRandomLetter = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters[Math.floor(Math.random() * letters.length)];
};

const getPairFromPalette = () => {
  const bgIdx = Math.floor(Math.random() * PALETTE.length);
  let fgIdx = Math.floor(Math.random() * PALETTE.length);
  
  // Ensure background and foreground are different
  while (fgIdx === bgIdx) {
    fgIdx = Math.floor(Math.random() * PALETTE.length);
  }
  
  return {
    bgColor: `#${PALETTE[bgIdx]}`,
    fgColor: `#${PALETTE[fgIdx]}`
  };
};

const ChromaGrid: React.FC = () => {
  const [items, setItems] = useState<GridItem[]>([]);
  const [cellSize, setCellSize] = useState(100); // Increased from 30 to 100
  const [isFullscreen, setIsFullscreen] = useState(false);

  const generateGrid = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    const total = cols * rows;

    const newItems: GridItem[] = Array.from({ length: total }, (_, i) => {
      const { bgColor, fgColor } = getPairFromPalette();
      return {
        id: `${i}-${Math.random()}`,
        letter: getRandomLetter(),
        bgColor,
        fgColor,
      };
    });
    setItems(newItems);
  }, [cellSize]);

  useEffect(() => {
    generateGrid();
    window.addEventListener('resize', generateGrid);
    return () => window.removeEventListener('resize', generateGrid);
  }, [generateGrid]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleCellClick = (index: number) => {
    setItems(prev => {
      const next = [...prev];
      const { bgColor, fgColor } = getPairFromPalette();
      next[index] = {
        ...next[index],
        letter: getRandomLetter(),
        bgColor,
        fgColor,
      };
      return next;
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Grid Container */}
      <div 
        className="grid w-full h-full"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${cellSize}px, 1fr))`,
          gridAutoRows: `${cellSize}px`
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
              className="letter-text font-normal leading-none pointer-events-none"
              style={{ 
                fontSize: `${cellSize * 0.85}px`,
                fontFamily: "'Gloria Hallelujah', cursive"
              }}
            >
              {item.letter}
            </span>
          </div>
        ))}
      </div>

      {/* Floating Controls - High z-index to stay above letters */}
      <div className="fixed bottom-6 left-6 flex flex-col gap-3 z-50">
        <button
          onClick={generateGrid}
          className="p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all shadow-2xl group"
          title="Regenerate All"
        >
          <RefreshCw size={24} className="group-active:rotate-180 transition-transform duration-500" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all shadow-2xl"
          title="Toggle Fullscreen"
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