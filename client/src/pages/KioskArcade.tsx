import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Zap, Grid3X3, Target } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type GameId = "ninja-dodge" | "belt-breaker" | "dojo-memory" | "reaction-strike" | null;

// ─── Ninja Dodge Game ─────────────────────────────────────────────────────────
function NinjaDodge({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    x: 200, y: 500, vx: 0,
    shurikens: [] as { x: number; y: number; rot: number; speed: number }[],
    score: 0, lives: 3, gameOver: false, frame: 0,
    keys: { left: false, right: false },
  });
  const animRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.x = 200; s.y = 500; s.vx = 0;
    s.shurikens = []; s.score = 0; s.lives = 3;
    s.gameOver = false; s.frame = 0;
    setScore(0); setLives(3); setGameOver(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.type === "keydown") {
        if (e.key === "ArrowLeft") s.keys.left = true;
        if (e.key === "ArrowRight") s.keys.right = true;
      } else {
        if (e.key === "ArrowLeft") s.keys.left = false;
        if (e.key === "ArrowRight") s.keys.right = false;
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const tx = e.touches[0].clientX - rect.left;
      stateRef.current.x = tx;
    };
    canvas.addEventListener("touchmove", onTouch, { passive: false });
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.x = e.clientX - rect.left;
    });

    function loop() {
      const s = stateRef.current;
      if (s.gameOver) return;

      // Movement
      if (s.keys.left) s.vx -= 3;
      if (s.keys.right) s.vx += 3;
      s.vx *= 0.85;
      s.x = Math.max(20, Math.min(W - 20, s.x + s.vx));

      // Spawn shurikens
      s.frame++;
      const spawnRate = Math.max(20, 60 - Math.floor(s.score / 10));
      if (s.frame % spawnRate === 0) {
        s.shurikens.push({
          x: Math.random() * (W - 40) + 20,
          y: -20,
          rot: 0,
          speed: 3 + Math.random() * 3 + s.score * 0.05,
        });
      }

      // Move shurikens
      s.shurikens = s.shurikens.filter((sh) => {
        sh.y += sh.speed;
        sh.rot += 0.15;
        if (sh.y > H + 20) { s.score++; setScore(s.score); return false; }
        // Collision
        const dx = sh.x - s.x, dy = sh.y - s.y;
        if (Math.sqrt(dx * dx + dy * dy) < 28) {
          s.lives--;
          setLives(s.lives);
          if (s.lives <= 0) { s.gameOver = true; setGameOver(true); }
          return false;
        }
        return true;
      });

      // Draw
      ctx.clearRect(0, 0, W, H);
      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0a0a0a");
      bg.addColorStop(1, "#1a0505");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = "rgba(200,0,0,0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
      for (let i = 0; i < H; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

      // Ninja (player)
      ctx.save();
      ctx.translate(s.x, s.y);
      // Body
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = "#e00";
      ctx.fillRect(-8, -5, 5, 4);
      ctx.fillRect(3, -5, 5, 4);
      // Headband
      ctx.fillStyle = "#c00";
      ctx.fillRect(-18, -8, 36, 5);
      ctx.restore();

      // Shurikens
      s.shurikens.forEach((sh) => {
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(sh.rot);
        ctx.fillStyle = "#aaa";
        for (let i = 0; i < 4; i++) {
          ctx.save();
          ctx.rotate((i * Math.PI) / 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-6, -14);
          ctx.lineTo(6, -14);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = "#666";
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, W, 36);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px monospace";
      ctx.fillText(`SCORE: ${s.score}`, 12, 24);
      ctx.fillText(`❤️`.repeat(s.lives), W - 90, 24);

      animRef.current = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-2 text-red-400 hover:text-red-300 font-bold">
          <ArrowLeft size={18} /> BACK
        </button>
        <h2 className="text-white font-black text-xl tracking-widest">NINJA DODGE</h2>
        <div className="w-16" />
      </div>
      <p className="text-gray-400 text-sm">Use ← → arrow keys or tap/click to dodge shurikens</p>
      <canvas
        ref={canvasRef}
        width={400}
        height={560}
        className="rounded-xl border border-red-900 shadow-2xl cursor-pointer"
        style={{ touchAction: "none" }}
      />
      {gameOver && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-red-400 font-black text-2xl">GAME OVER — Score: {score}</p>
          <button
            onClick={reset}
            className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-3 rounded-xl text-lg tracking-widest"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Belt Breaker (Breakout clone) ────────────────────────────────────────────
const BELT_COLORS = ["#fff", "#ffd700", "#ff8c00", "#00aa00", "#0055cc", "#8b00ff", "#cc0000", "#4a2c00", "#111111"];
const BELT_LABELS = ["White", "Yellow", "Orange", "Green", "Blue", "Purple", "Red", "Brown", "Black"];

function BeltBreaker({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    px: 200, pw: 80,
    bx: 200, by: 300, bdx: 3.5, bdy: -3.5,
    bricks: [] as { x: number; y: number; color: string; alive: boolean; label: string }[],
    score: 0, lives: 3, gameOver: false, won: false, started: false,
  });
  const animRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const buildBricks = () => {
    const bricks: typeof stateRef.current.bricks = [];
    const cols = 9, rows = 5;
    const bw = 380 / cols, bh = 22;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const beltIdx = Math.floor((r * cols + c) / cols) % BELT_COLORS.length;
        bricks.push({
          x: 10 + c * bw,
          y: 50 + r * (bh + 4),
          color: BELT_COLORS[beltIdx],
          label: BELT_LABELS[beltIdx],
          alive: true,
        });
      }
    }
    return bricks;
  };

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.px = 200; s.pw = 80;
    s.bx = 200; s.by = 300; s.bdx = 3.5; s.bdy = -3.5;
    s.bricks = buildBricks();
    s.score = 0; s.lives = 3; s.gameOver = false; s.won = false; s.started = false;
    setScore(0); setLives(3); setGameOver(false); setWon(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const s = stateRef.current;
    s.bricks = buildBricks();

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      s.px = Math.max(s.pw / 2, Math.min(W - s.pw / 2, e.clientX - rect.left));
      s.started = true;
    };
    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      s.px = Math.max(s.pw / 2, Math.min(W - s.pw / 2, e.touches[0].clientX - rect.left));
      s.started = true;
    };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("touchmove", onTouch, { passive: false });
    canvas.addEventListener("click", () => { s.started = true; });

    function loop() {
      if (s.gameOver || s.won) return;

      if (s.started) {
        s.bx += s.bdx;
        s.by += s.bdy;
      }

      // Wall bounce
      if (s.bx < 8 || s.bx > W - 8) s.bdx *= -1;
      if (s.by < 8) s.bdy *= -1;

      // Paddle bounce
      if (s.by > H - 30 && s.by < H - 10 && Math.abs(s.bx - s.px) < s.pw / 2 + 8) {
        s.bdy = -Math.abs(s.bdy);
        const offset = (s.bx - s.px) / (s.pw / 2);
        s.bdx = offset * 5;
      }

      // Bottom — lose life
      if (s.by > H + 10) {
        s.lives--;
        setLives(s.lives);
        if (s.lives <= 0) { s.gameOver = true; setGameOver(true); return; }
        s.bx = s.px; s.by = H - 50; s.bdx = 3.5; s.bdy = -3.5; s.started = false;
      }

      // Brick collision
      s.bricks.forEach((b) => {
        if (!b.alive) return;
        if (s.bx > b.x && s.bx < b.x + 380 / 9 && s.by > b.y && s.by < b.y + 22) {
          b.alive = false;
          s.bdy *= -1;
          s.score += 10;
          setScore(s.score);
        }
      });

      // Win check
      if (s.bricks.every((b) => !b.alive)) { s.won = true; setWon(true); return; }

      // Draw
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#050510");
      bg.addColorStop(1, "#0a0520");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Bricks
      const bw = 380 / 9;
      s.bricks.forEach((b) => {
        if (!b.alive) return;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x + 1, b.y + 1, bw - 2, 20, 3);
        ctx.fill();
        ctx.fillStyle = b.color === "#111111" ? "#555" : "rgba(0,0,0,0.5)";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(b.label.toUpperCase(), b.x + bw / 2, b.y + 14);
      });

      // Paddle
      ctx.fillStyle = "#c00";
      ctx.beginPath();
      ctx.roundRect(s.px - s.pw / 2, H - 22, s.pw, 14, 7);
      ctx.fill();

      // Ball
      const ballGrad = ctx.createRadialGradient(s.bx - 3, s.by - 3, 1, s.bx, s.by, 9);
      ballGrad.addColorStop(0, "#fff");
      ballGrad.addColorStop(1, "#c00");
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(s.bx, s.by, 9, 0, Math.PI * 2);
      ctx.fill();

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, W, 36);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 15px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE: ${s.score}`, 12, 24);
      ctx.fillText(`LIVES: ${"♥ ".repeat(s.lives)}`, W - 120, 24);

      if (!s.started) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, H / 2 - 30, W, 50);
        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.fillText("MOVE MOUSE / TAP TO START", W / 2, H / 2 + 8);
      }

      animRef.current = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-2 text-red-400 hover:text-red-300 font-bold">
          <ArrowLeft size={18} /> BACK
        </button>
        <h2 className="text-white font-black text-xl tracking-widest">BELT BREAKER</h2>
        <div className="w-16" />
      </div>
      <p className="text-gray-400 text-sm">Move mouse or touch to control the paddle</p>
      <canvas
        ref={canvasRef}
        width={400}
        height={560}
        className="rounded-xl border border-purple-900 shadow-2xl cursor-none"
        style={{ touchAction: "none" }}
      />
      {(gameOver || won) && (
        <div className="flex flex-col items-center gap-3">
          <p className={`font-black text-2xl ${won ? "text-yellow-400" : "text-red-400"}`}>
            {won ? `🏆 YOU WIN! Score: ${score}` : `GAME OVER — Score: ${score}`}
          </p>
          <button
            onClick={reset}
            className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-3 rounded-xl text-lg tracking-widest"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Dojo Memory ──────────────────────────────────────────────────────────────
const CARD_ICONS = ["🥋", "🥊", "⚔️", "🏆", "🎯", "🔥", "⭐", "🥷"];

function DojoMemory({ onBack }: { onBack: () => void }) {
  const makeCards = () => {
    const icons = [...CARD_ICONS, ...CARD_ICONS];
    for (let i = icons.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [icons[i], icons[j]] = [icons[j], icons[i]];
    }
    return icons.map((icon, i) => ({ id: i, icon, flipped: false, matched: false }));
  };

  const [cards, setCards] = useState(makeCards);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [locked, setLocked] = useState(false);

  const flip = (id: number) => {
    if (locked) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newCards = cards.map((c) => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newSelected = [...selected, id];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [a, b] = newSelected.map((sid) => newCards.find((c) => c.id === sid)!);
      if (a.icon === b.icon) {
        const matched = newCards.map((c) => newSelected.includes(c.id) ? { ...c, matched: true } : c);
        setCards(matched);
        setSelected([]);
        setLocked(false);
        if (matched.every((c) => c.matched)) setWon(true);
      } else {
        setTimeout(() => {
          setCards((prev) => prev.map((c) => newSelected.includes(c.id) ? { ...c, flipped: false } : c));
          setSelected([]);
          setLocked(false);
        }, 900);
      }
    }
  };

  const reset = () => { setCards(makeCards()); setSelected([]); setMoves(0); setWon(false); setLocked(false); };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <div className="flex items-center justify-between w-full">
        <button onClick={onBack} className="flex items-center gap-2 text-red-400 hover:text-red-300 font-bold">
          <ArrowLeft size={18} /> BACK
        </button>
        <h2 className="text-white font-black text-xl tracking-widest">DOJO MEMORY</h2>
        <div className="text-gray-400 text-sm font-mono">MOVES: {moves}</div>
      </div>
      <p className="text-gray-400 text-sm">Match all the martial arts pairs</p>
      <div className="grid grid-cols-4 gap-3 w-full">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => flip(card.id)}
            className={`
              aspect-square rounded-xl text-3xl flex items-center justify-center
              transition-all duration-300 select-none
              ${card.matched
                ? "bg-green-900 border-2 border-green-500 scale-95"
                : card.flipped
                ? "bg-gray-800 border-2 border-yellow-500 scale-105"
                : "bg-red-950 border-2 border-red-800 hover:border-red-500 hover:scale-105 cursor-pointer"
              }
            `}
          >
            {card.flipped || card.matched ? card.icon : "🥷"}
          </button>
        ))}
      </div>
      {won && (
        <div className="flex flex-col items-center gap-3 mt-4">
          <p className="text-yellow-400 font-black text-2xl">🏆 CLEARED IN {moves} MOVES!</p>
          <button
            onClick={reset}
            className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-3 rounded-xl text-lg tracking-widest"
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Reaction Strike ──────────────────────────────────────────────────────────
type ReactionPhase = "waiting" | "ready" | "active" | "result" | "toosoon";

function ReactionStrike({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<ReactionPhase>("waiting");
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });

  const startRound = () => {
    setPhase("ready");
    const delay = 1500 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      setTargetPos({ x: 10 + Math.random() * 70, y: 10 + Math.random() * 70 });
      setStartTime(Date.now());
      setPhase("active");
    }, delay);
  };

  const handleTap = () => {
    if (phase === "waiting") { startRound(); return; }
    if (phase === "ready") {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase("toosoon");
      return;
    }
    if (phase === "active") {
      const rt = Date.now() - startTime;
      setReactionTime(rt);
      setAttempts((prev) => [...prev, rt]);
      setBest((prev) => prev === null ? rt : Math.min(prev, rt));
      setPhase("result");
    }
    if (phase === "result" || phase === "toosoon") { startRound(); }
  };

  const getRating = (ms: number) => {
    if (ms < 200) return { label: "LIGHTNING ⚡", color: "text-yellow-400" };
    if (ms < 300) return { label: "WARRIOR 🥷", color: "text-green-400" };
    if (ms < 450) return { label: "STUDENT 🥋", color: "text-blue-400" };
    return { label: "KEEP TRAINING 💪", color: "text-gray-400" };
  };

  const avg = attempts.length > 0 ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length) : null;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <div className="flex items-center justify-between w-full">
        <button onClick={onBack} className="flex items-center gap-2 text-red-400 hover:text-red-300 font-bold">
          <ArrowLeft size={18} /> BACK
        </button>
        <h2 className="text-white font-black text-xl tracking-widest">REACTION STRIKE</h2>
        <div className="w-16" />
      </div>

      {/* Stats bar */}
      <div className="flex gap-6 text-sm font-mono">
        {best !== null && <span className="text-yellow-400">BEST: {best}ms</span>}
        {avg !== null && <span className="text-gray-400">AVG: {avg}ms</span>}
        {attempts.length > 0 && <span className="text-gray-500">ROUNDS: {attempts.length}</span>}
      </div>

      {/* Arena */}
      <div
        className="relative w-full rounded-2xl border-2 border-red-900 overflow-hidden cursor-pointer select-none"
        style={{ height: 420, background: "linear-gradient(135deg, #0a0a0a 0%, #1a0505 100%)" }}
        onClick={handleTap}
      >
        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#c00" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* State overlays */}
        {phase === "waiting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl">🎯</div>
            <p className="text-white font-black text-2xl tracking-widest">TAP TO START</p>
            <p className="text-gray-500 text-sm">Test your reaction speed</p>
          </div>
        )}

        {phase === "ready" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="text-5xl animate-pulse">⏳</div>
            <p className="text-red-400 font-black text-xl tracking-widest">WAIT FOR IT...</p>
            <p className="text-gray-500 text-sm">Don't tap yet!</p>
          </div>
        )}

        {phase === "active" && (
          <button
            className="absolute w-20 h-20 rounded-full flex items-center justify-center text-3xl animate-ping-once"
            style={{
              left: `${targetPos.x}%`,
              top: `${targetPos.y}%`,
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(circle, #ff4400, #cc0000)",
              boxShadow: "0 0 30px #ff4400, 0 0 60px #cc0000",
            }}
          >
            ⚡
          </button>
        )}

        {phase === "toosoon" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-red-950/80">
            <div className="text-5xl">❌</div>
            <p className="text-red-400 font-black text-2xl">TOO SOON!</p>
            <p className="text-gray-400 text-sm">Tap to try again</p>
          </div>
        )}

        {phase === "result" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <p className="text-white font-black text-5xl">{reactionTime}ms</p>
            <p className={`font-black text-xl ${getRating(reactionTime).color}`}>
              {getRating(reactionTime).label}
            </p>
            {best === reactionTime && attempts.length > 1 && (
              <p className="text-yellow-400 font-bold text-sm animate-bounce">🏆 NEW BEST!</p>
            )}
            <p className="text-gray-500 text-sm mt-2">Tap to strike again</p>
          </div>
        )}
      </div>

      {/* Attempt history */}
      {attempts.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center">
          {attempts.slice(-8).map((t, i) => (
            <span
              key={i}
              className={`text-xs font-mono px-2 py-1 rounded ${
                t === best ? "bg-yellow-900 text-yellow-400 border border-yellow-600" : "bg-gray-900 text-gray-500"
              }`}
            >
              {t}ms
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Game Selector (Main Arcade Page) ────────────────────────────────────────
const GAMES = [
  {
    id: "ninja-dodge" as GameId,
    title: "NINJA DODGE",
    desc: "Dodge falling shurikens",
    icon: "🥷",
    color: "from-red-950 to-red-900",
    border: "border-red-700",
    badge: "REFLEX",
    badgeColor: "bg-red-600",
  },
  {
    id: "belt-breaker" as GameId,
    title: "BELT BREAKER",
    desc: "Break through every belt",
    icon: "🥋",
    color: "from-purple-950 to-purple-900",
    border: "border-purple-700",
    badge: "SKILL",
    badgeColor: "bg-purple-600",
  },
  {
    id: "dojo-memory" as GameId,
    title: "DOJO MEMORY",
    desc: "Match martial arts pairs",
    icon: "🧠",
    color: "from-blue-950 to-blue-900",
    border: "border-blue-700",
    badge: "MEMORY",
    badgeColor: "bg-blue-600",
  },
  {
    id: "reaction-strike" as GameId,
    title: "REACTION STRIKE",
    desc: "Test your reaction speed",
    icon: "⚡",
    color: "from-yellow-950 to-yellow-900",
    border: "border-yellow-700",
    badge: "SPEED",
    badgeColor: "bg-yellow-600",
  },
];

export default function KioskArcade() {
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState<GameId>(null);

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, #2a0505 0%, #0a0a0a 60%, #000 100%)",
        fontFamily: "'Arial Black', 'Impact', sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-red-950">
        <button
          onClick={() => activeGame ? setActiveGame(null) : navigate("/kiosk-home")}
          className="flex items-center gap-2 text-red-400 hover:text-red-300 font-black text-sm tracking-widest transition-colors"
        >
          <ArrowLeft size={20} />
          {activeGame ? "GAME SELECT" : "BACK TO KIOSK"}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-lg">🕹️</div>
          <h1 className="text-white font-black text-xl tracking-widest">DOJO ARCADE</h1>
        </div>
        <div className="flex items-center gap-1 text-gray-500 text-xs font-mono">
          <Trophy size={14} />
          <span>4 GAMES</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-6 py-8 overflow-y-auto">
        {!activeGame ? (
          <>
            <p className="text-gray-400 text-sm tracking-widest mb-8">SELECT YOUR GAME</p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  onClick={() => setActiveGame(game.id)}
                  className={`
                    relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl
                    bg-gradient-to-br ${game.color} border-2 ${game.border}
                    hover:scale-105 active:scale-95 transition-all duration-200
                    shadow-lg hover:shadow-2xl
                  `}
                >
                  <span className={`absolute top-3 right-3 text-xs font-black px-2 py-0.5 rounded-full text-white ${game.badgeColor}`}>
                    {game.badge}
                  </span>
                  <div className="text-5xl">{game.icon}</div>
                  <div className="text-center">
                    <p className="text-white font-black text-base tracking-widest leading-tight">{game.title}</p>
                    <p className="text-gray-400 text-xs mt-1">{game.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Decorative bottom */}
            <div className="mt-12 text-center">
              <p className="text-gray-700 text-xs tracking-widest">DOJO ARCADE • POWERED BY DOJOFLOW</p>
            </div>
          </>
        ) : (
          <div className="w-full max-w-md">
            {activeGame === "ninja-dodge" && <NinjaDodge onBack={() => setActiveGame(null)} />}
            {activeGame === "belt-breaker" && <BeltBreaker onBack={() => setActiveGame(null)} />}
            {activeGame === "dojo-memory" && <DojoMemory onBack={() => setActiveGame(null)} />}
            {activeGame === "reaction-strike" && <ReactionStrike onBack={() => setActiveGame(null)} />}
          </div>
        )}
      </div>
    </div>
  );
}
