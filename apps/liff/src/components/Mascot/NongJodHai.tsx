import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

export type MascotState = 'idle' | 'writing' | 'success' | 'warning';

interface Props {
  state?: MascotState;
  size?: number;
  className?: string;
}

const SPARKLE_POSITIONS = [
  { x: -40, y: -38, delay: 0.00, emoji: '✨' },
  { x:  40, y: -42, delay: 0.08, emoji: '⭐' },
  { x: -48, y:   5, delay: 0.16, emoji: '💖' },
  { x:  48, y:   2, delay: 0.12, emoji: '✨' },
  { x:   5, y: -52, delay: 0.04, emoji: '🌟' },
  { x: -22, y: -55, delay: 0.20, emoji: '💛' },
];

export default function NongJodHai({ state = 'idle', size = 120, className }: Props) {
  const prefersReduced = useReducedMotion();
  const [blink, setBlink] = useState(false);

  // Periodic blinking
  useEffect(() => {
    if (prefersReduced) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); schedule(); }, 180);
      }, 2800 + Math.random() * 2400);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [prefersReduced]);

  // Main body animation
  const bodyVariants = {
    idle: {
      y: [0, -7, 0],
      transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' as const },
    },
    writing: {
      y: [0, -3, 0],
      transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' as const },
    },
    success: {
      y: [0, -26, -4, -14, 0],
      transition: { duration: 0.85, times: [0, 0.28, 0.5, 0.72, 1], ease: 'easeOut' as const },
    },
    warning: {
      x: [-4, 4, -4, 4, -2, 2, 0],
      transition: { duration: 0.55, times: [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1], repeat: Infinity, repeatDelay: 3 },
    },
  };

  // Pen writing animation
  const penVariants = {
    idle:    { rotate: 0, x: 0 },
    writing: { rotate: [-8, 8, -8], x: [-4, 4, -4], transition: { duration: 0.28, repeat: Infinity } },
    success: { rotate: 0, x: 0 },
    warning: { rotate: 0, x: 0 },
  };

  // Mouth path per state
  const mouths: Record<MascotState, string> = {
    idle:    'M 49 88 Q 60 97 71 88',
    writing: 'M 52 88 Q 60 94 68 88',
    success: 'M 45 85 Q 60 100 75 85',
    warning: 'M 51 91 Q 60 86 69 91',
  };

  // Eyebrow y-offset per state
  const browOffset: Record<MascotState, number> = { idle: 0, writing: -2, success: -4, warning: 5 };

  const h = size * (160 / 120);

  return (
    <svg
      viewBox="0 0 120 160"
      width={size}
      height={h}
      style={{ overflow: 'visible', display: 'block' }}
      className={className}
      aria-label="น้องจดให้"
    >
      {/* ── Sparkles (success) ─────────────────────────────────────────── */}
      <AnimatePresence>
        {state === 'success' && SPARKLE_POSITIONS.map((s) => (
          <motion.text
            key={s.emoji + s.delay}
            x={60 + s.x}
            y={80 + s.y}
            textAnchor="middle"
            fontSize="13"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.2, 1, 0], y: [80 + s.y, 80 + s.y - 20] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, delay: s.delay }}
          >
            {s.emoji}
          </motion.text>
        ))}
      </AnimatePresence>

      {/* ── Main Body group (floats) ─────────────────────────────────── */}
      <motion.g
        variants={bodyVariants}
        animate={prefersReduced ? {} : state}
        style={{ originX: '60px', originY: '155px' }}
      >
        {/* ── HAIR (back layer) ── */}
        <ellipse cx="60" cy="52" rx="47" ry="48" fill="#2C1A10" />
        {/* Side hair pieces */}
        <path d="M 16 68 Q 12 92 14 115 Q 17 124 25 122 Q 32 119 28 95 Z" fill="#2C1A10" />
        <path d="M 104 68 Q 108 92 106 115 Q 103 124 95 122 Q 88 119 92 95 Z" fill="#2C1A10" />

        {/* ── FACE ── */}
        <ellipse cx="60" cy="70" rx="44" ry="47" fill="#FFD9B8" />

        {/* ── EARS ── */}
        <ellipse cx="16" cy="70" rx="8" ry="10" fill="#FFD9B8" />
        <ellipse cx="104" cy="70" rx="8" ry="10" fill="#FFD9B8" />
        <ellipse cx="16" cy="70" rx="5" ry="7" fill="#FFC89A" />
        <ellipse cx="104" cy="70" rx="5" ry="7" fill="#FFC89A" />

        {/* ── BANGS ── */}
        <path d="M 22 50 Q 32 24 60 22 Q 88 24 98 50 Q 82 34 60 32 Q 38 34 22 50 Z" fill="#2C1A10" />
        <path d="M 22 52 Q 26 38 36 32 Q 28 40 26 55 Z" fill="#2C1A10" />
        <path d="M 98 52 Q 94 38 84 32 Q 92 40 94 55 Z" fill="#2C1A10" />

        {/* ── EYES ── */}
        {/* Left eye */}
        <ellipse cx="43" cy="65" rx="13" ry="15" fill="white" />
        <circle cx="44" cy="66" r="9" fill="#3ECFBF" />
        <circle cx="46" cy="66" r="5.5" fill="#1A2E2B" />
        <circle cx="49" cy="62" r="2.8" fill="white" />
        <circle cx="42" cy="69" r="1.4" fill="white" />
        {/* Left eyelid (blink) */}
        <motion.rect
          x="30" y="50" width="26" height="15" rx="13"
          fill="#FFD9B8"
          animate={{ scaleY: blink ? 1 : 0 }}
          style={{ originY: '50px', originX: '43px' }}
          transition={{ duration: 0.08 }}
        />

        {/* Right eye */}
        <ellipse cx="77" cy="65" rx="13" ry="15" fill="white" />
        <circle cx="78" cy="66" r="9" fill="#3ECFBF" />
        <circle cx="80" cy="66" r="5.5" fill="#1A2E2B" />
        <circle cx="83" cy="62" r="2.8" fill="white" />
        <circle cx="76" cy="69" r="1.4" fill="white" />
        {/* Right eyelid (blink) */}
        <motion.rect
          x="64" y="50" width="26" height="15" rx="13"
          fill="#FFD9B8"
          animate={{ scaleY: blink ? 1 : 0 }}
          style={{ originY: '50px', originX: '77px' }}
          transition={{ duration: 0.08 }}
        />

        {/* ── EYEBROWS ── */}
        <motion.path
          d={`M 32 ${52 + browOffset[state]} Q 43 ${46 + browOffset[state]} 54 ${52 + browOffset[state]}`}
          stroke="#2C1A10" strokeWidth="2.5" fill="none" strokeLinecap="round"
          animate={{ d: `M 32 ${52 + browOffset[state]} Q 43 ${46 + browOffset[state]} 54 ${52 + browOffset[state]}` }}
          transition={{ duration: 0.25 }}
        />
        <motion.path
          d={`M 66 ${52 + browOffset[state]} Q 77 ${46 + browOffset[state]} 88 ${52 + browOffset[state]}`}
          stroke="#2C1A10" strokeWidth="2.5" fill="none" strokeLinecap="round"
          animate={{ d: `M 66 ${52 + browOffset[state]} Q 77 ${46 + browOffset[state]} 88 ${52 + browOffset[state]}` }}
          transition={{ duration: 0.25 }}
        />

        {/* ── BLUSH ── */}
        <ellipse cx="26" cy="78" rx="11" ry="7" fill="#FFB6C1" opacity="0.55" />
        <ellipse cx="94" cy="78" rx="11" ry="7" fill="#FFB6C1" opacity="0.55" />

        {/* ── NOSE ── */}
        <ellipse cx="60" cy="80" rx="2.5" ry="1.8" fill="#FFC89A" />

        {/* ── MOUTH ── */}
        <motion.path
          d={mouths[state]}
          fill="none" stroke="#E8839A" strokeWidth="2.8" strokeLinecap="round"
          animate={{ d: mouths[state] }}
          transition={{ duration: 0.3 }}
        />

        {/* ── BODY / DRESS ── */}
        <rect x="30" y="112" width="60" height="46" rx="20" fill="#3ECFBF" />
        {/* Dress shine */}
        <path d="M 35 118 Q 50 114 60 116 Q 50 118 35 122 Z" fill="rgba(255,255,255,0.25)" />
        {/* Collar bow */}
        <path d="M 60 116 L 52 126 L 60 122 L 68 126 Z" fill="#FFE4F0" />
        <circle cx="60" cy="122" r="4" fill="#FF9EBB" />

        {/* ── LEFT ARM ── */}
        <path d="M 30 128 Q 14 134 16 152" stroke="#3ECFBF" strokeWidth="14" fill="none" strokeLinecap="round" />
        <circle cx="16" cy="152" r="8" fill="#FFD9B8" />

        {/* ── RIGHT ARM + PEN GROUP ── */}
        <motion.g variants={penVariants} animate={state} style={{ originX: '95px', originY: '135px' }}>
          <path d="M 90 128 Q 106 134 104 152" stroke="#3ECFBF" strokeWidth="14" fill="none" strokeLinecap="round" />
          <circle cx="104" cy="152" r="8" fill="#FFD9B8" />
          {/* Notebook */}
          <rect x="88" y="134" width="28" height="22" rx="4" fill="#FFE4F0" stroke="#FFAACF" strokeWidth="1.5" />
          <rect x="88" y="134" width="5" height="22" rx="2" fill="#FFAACF" />
          <line x1="96" y1="141" x2="113" y2="141" stroke="#FFCCE4" strokeWidth="1.2" />
          <line x1="96" y1="146" x2="113" y2="146" stroke="#FFCCE4" strokeWidth="1.2" />
          <line x1="96" y1="151" x2="108" y2="151" stroke="#FFCCE4" strokeWidth="1.2" />
          {/* Pen */}
          <rect x="112" y="126" width="4" height="18" rx="2" fill="#FFD700" transform="rotate(-18 112 126)" />
          <path d="M 110 143 L 114 150 L 108 143 Z" fill="#FF8C42" transform="rotate(-18 112 126)" />
        </motion.g>
      </motion.g>
    </svg>
  );
}
