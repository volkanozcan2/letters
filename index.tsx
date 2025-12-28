import React, { useState, useEffect, useCallback } from 'react';
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

  const calculateGrid = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Smaller target size for cells
    const targetSize = 110; 
    const cols = Math.ceil(width / targetSize);
    const cellSize = width / cols;
    const rows = Math.ceil(height / cellSize);
    
    setGridConfig({ cols, rows, cellSize });

    const total = cols * rows;
    const newItems: GridItem[] = Array.from({ length: total }, (_, i) => {
      const { bgColor, fgColor } = getUniqueColors();
      return {
        id: `${i}-${Math.random()}`,
        letter: getRandomLetter(),
        bgColor,
        fgColor,
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
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleCellClick = (index: number) => {
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
                // Letters made smaller as requested
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
          className="p-3 bg-black/30 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-black/50 active:scale-90 transition-all shadow-xl"
          aria-label="Shuffle grid"
        >
          <RefreshCw size={24} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-3 bg-black/30 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-black/50 active:scale-90 transition-all shadow-xl"
          aria-label="Toggle fullscreen"
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