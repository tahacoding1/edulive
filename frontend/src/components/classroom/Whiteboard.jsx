import { useRef, useState, useEffect, useCallback } from 'react';
import { getSocket } from '../../utils/socket';

const PRESETS = ['#ffffff','#2979ff','#00d4ff','#00e676','#ffb300','#ff3d71','#e040fb','#ff6d00'];

export default function Whiteboard({ isTeacher, roomId }) {
  const canvasRef   = useRef(null);
  const containerRef = useRef(null);
  const ctxRef      = useRef(null);
  const history     = useRef([]);
  const lastPos     = useRef(null);
  const isDrawing   = useRef(false);

  const [tool,    setTool]    = useState('pen');
  const [color,   setColor]   = useState('#3b82f6');
  const [size,    setSize]    = useState(4);
  const [drawing, setDrawing] = useState(false);

  // ── Init canvas ──
  const initCanvas = useCallback(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const saved = ctxRef.current
      ? ctxRef.current.getImageData(0, 0, canvas.width, canvas.height)
      : null;

    canvas.width  = container.offsetWidth;
    canvas.height = container.offsetHeight;
    ctxRef.current = canvas.getContext('2d');
    ctxRef.current.fillStyle = '#070f1e';
    ctxRef.current.fillRect(0, 0, canvas.width, canvas.height);
    if (saved) ctxRef.current.putImageData(saved, 0, 0);
  }, []);

  useEffect(() => {
    initCanvas();
    const ro = new ResizeObserver(initCanvas);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [initCanvas]);

  // ── Socket: receive remote strokes ──
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onDraw = ({ stroke }) => drawStroke(stroke, false);
    const onClear = () => {
      const c = canvasRef.current;
      ctxRef.current.fillStyle = '#070f1e';
      ctxRef.current.fillRect(0, 0, c.width, c.height);
    };
    const onUndo = () => {
      if (history.current.length) ctxRef.current.putImageData(history.current.pop(), 0, 0);
    };

    socket.on('whiteboard-draw',  onDraw);
    socket.on('whiteboard-clear', onClear);
    socket.on('whiteboard-undo',  onUndo);
    return () => {
      socket.off('whiteboard-draw',  onDraw);
      socket.off('whiteboard-clear', onClear);
      socket.off('whiteboard-undo',  onUndo);
    };
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const src    = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * (canvas.width  / rect.width),
      y: (src.clientY - rect.top)  * (canvas.height / rect.height),
    };
  };

  const drawStroke = ({ from, to, color: c, size: s, eraser }, emit) => {
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
    if (eraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = s * 5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = c;
      ctx.lineWidth   = s;
    }
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const startDraw = (e) => {
    if (!isTeacher) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    history.current.push(ctxRef.current.getImageData(0, 0, canvas.width, canvas.height));
    if (history.current.length > 40) history.current.shift();
    isDrawing.current = true;
    setDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e) => {
    if (!isDrawing.current || !isTeacher) return;
    e.preventDefault();
    const pos    = getPos(e);
    const stroke = { from: lastPos.current, to: pos, color, size, eraser: tool === 'eraser' };
    drawStroke(stroke, true);
    getSocket()?.emit('whiteboard-draw', { roomId, stroke });
    lastPos.current = pos;
  };

  const stopDraw = () => { isDrawing.current = false; setDrawing(false); lastPos.current = null; };

  const undo = () => {
    if (!history.current.length) return;
    ctxRef.current.putImageData(history.current.pop(), 0, 0);
    getSocket()?.emit('whiteboard-undo', { roomId });
  };

  const clearAll = () => {
    const canvas = canvasRef.current;
    history.current.push(ctxRef.current.getImageData(0, 0, canvas.width, canvas.height));
    ctxRef.current.fillStyle = '#070f1e';
    ctxRef.current.fillRect(0, 0, canvas.width, canvas.height);
    getSocket()?.emit('whiteboard-clear', { roomId });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      {isTeacher && (
        <div className="flex items-center gap-2 px-3.5 py-2 border-b border-border bg-elevated flex-shrink-0 flex-wrap">
          {[['pen','✏️ Pen'],['eraser','◻ Eraser']].map(([t, label]) => (
            <button key={t} onClick={() => setTool(t)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all
                ${tool === t ? 'bg-primary border-primary text-white' : 'border-border text-textDim hover:border-borderLight'}`}>
              {label}
            </button>
          ))}

          <div className="w-px h-5 bg-border" />

          {PRESETS.map(pc => (
            <button key={pc} onClick={() => { setColor(pc); setTool('pen'); }}
              className="w-5 h-5 rounded-full transition-transform hover:scale-110 flex-shrink-0"
              style={{
                background: pc,
                outline: color === pc && tool === 'pen' ? `2px solid #00d4ff` : '2px solid transparent',
                outlineOffset: 2,
                border: pc === '#ffffff' ? '1px solid #1c2d4f' : 'none',
              }} />
          ))}
          <input type="color" value={color} onChange={e => { setColor(e.target.value); setTool('pen'); }}
            className="w-5 h-5 rounded-full cursor-pointer flex-shrink-0 border-0" title="Custom color" />

          <div className="w-px h-5 bg-border" />

          <div className="flex items-center gap-2">
            <span className="text-textDim text-xs">Size:</span>
            <input type="range" min="1" max="24" value={size} onChange={e => setSize(+e.target.value)}
              className="w-20" />
            <span className="text-textDim text-xs w-7">{size}px</span>
          </div>

          <div className="flex-1" />
          <button onClick={undo}
            className="px-3 py-1.5 border border-border rounded-md text-textDim text-xs hover:border-borderLight transition-colors">
            ↩ Undo
          </button>
          <button onClick={clearAll}
            className="px-3 py-1.5 bg-danger/10 border border-danger/40 rounded-md text-danger text-xs hover:bg-danger/20 transition-colors">
            🗑 Clear
          </button>
        </div>
      )}

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none',
                   cursor: !isTeacher ? 'default' : tool === 'eraser' ? 'cell' : 'crosshair' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        />
        {!isTeacher && (
          <div className="absolute bottom-3 right-3 bg-warning/10 border border-warning/40 rounded-md px-3 py-1 text-warning text-xs">
            👁 View Only
          </div>
        )}
      </div>
    </div>
  );
}
