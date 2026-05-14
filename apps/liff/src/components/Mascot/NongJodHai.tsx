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

  const bodyVariants = {
    idle:    { y: [0, -7, 0],          transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' as const } },
    writing: { y: [0, -3, 0],          transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' as const } },
    success: { y: [0, -26, -4, -14, 0],transition: { duration: 0.85, times: [0, 0.28, 0.5, 0.72, 1], ease: 'easeOut' as const } },
    warning: { x: [-4, 4, -4, 4, -2, 2, 0], transition: { duration: 0.55, times: [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1], repeat: Infinity, repeatDelay: 3 } },
  };

  const pencilVariants = {
    idle:    { rotate: 0, x: 0 },
    writing: { rotate: [-10, 10, -10], x: [-3, 3, -3], transition: { duration: 0.28, repeat: Infinity } },
    success: { rotate: 0, x: 0 },
    warning: { rotate: 0, x: 0 },
  };

  const mouths: Record<MascotState, string> = {
    idle:    'M 49 78 Q 60 87 71 78',
    writing: 'M 52 78 Q 60 84 68 78',
    success: 'M 44 75 Q 60 91 76 75',
    warning: 'M 51 81 Q 60 76 69 81',
  };

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
      {/* ── Sparkles (success) ── */}
      <AnimatePresence>
        {state === 'success' && SPARKLE_POSITIONS.map((s) => (
          <motion.text
            key={s.emoji + s.delay}
            x={60 + s.x} y={80 + s.y}
            textAnchor="middle" fontSize="13"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.2, 1, 0], y: [80 + s.y, 80 + s.y - 20] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, delay: s.delay }}
          >
            {s.emoji}
          </motion.text>
        ))}
      </AnimatePresence>

      <motion.g
        variants={bodyVariants}
        animate={prefersReduced ? {} : state}
        style={{ originX: '60px', originY: '155px' }}
      >
        {/* ── HAIR BACK ── */}
        <ellipse cx="60" cy="48" rx="40" ry="42" fill="#5C3317" />

        {/* ── LEFT BRAID ── */}
        <rect x="9" y="56" width="12" height="90" rx="6" fill="#5C3317" />
        <ellipse cx="15" cy="68"  rx="5.5" ry="7.5" fill="#7D4824" transform="rotate(-10 15 68)"  />
        <ellipse cx="15" cy="81"  rx="5.5" ry="7.5" fill="#3D2008" transform="rotate(10 15 81)"   />
        <ellipse cx="15" cy="94"  rx="5.5" ry="7.5" fill="#7D4824" transform="rotate(-10 15 94)"  />
        <ellipse cx="15" cy="107" rx="5.5" ry="7.5" fill="#3D2008" transform="rotate(10 15 107)"  />
        <ellipse cx="15" cy="120" rx="5.5" ry="7.5" fill="#7D4824" transform="rotate(-10 15 120)" />
        <ellipse cx="15" cy="133" rx="5.5" ry="7.5" fill="#3D2008" transform="rotate(10 15 133)"  />
        {/* Left hair tie */}
        <ellipse cx="15" cy="148" rx="8" ry="4"   fill="#F4A5B8" />
        <ellipse cx="15" cy="148" rx="4.5" ry="2.5" fill="#FACDD9" />

        {/* ── RIGHT BRAID ── */}
        <rect x="99" y="56" width="12" height="90" rx="6" fill="#5C3317" />
        <ellipse cx="105" cy="68"  rx="5.5" ry="7.5" fill="#7D4824" transform="rotate(10 105 68)"   />
        <ellipse cx="105" cy="81"  rx="5.5" ry="7.5" fill="#3D2008" transform="rotate(-10 105 81)"  />
        <ellipse cx="105" cy="94"  rx="5.5" ry="7.5" fill="#7D4824" transform="rotate(10 105 94)"   />
        <ellipse cx="105" cy="107" rx="5.5" ry="7.5" fill="#3D2008" transform="rotate(-10 105 107)" />
        <ellipse cx="105" cy="120" rx="5.5" ry="7.5" fill="#7D4824" transform="rotate(10 105 120)"  />
        <ellipse cx="105" cy="133" rx="5.5" ry="7.5" fill="#3D2008" transform="rotate(-10 105 133)" />
        {/* Right hair tie */}
        <ellipse cx="105" cy="148" rx="8" ry="4"   fill="#F4A5B8" />
        <ellipse cx="105" cy="148" rx="4.5" ry="2.5" fill="#FACDD9" />

        {/* ── FACE ── */}
        <ellipse cx="60" cy="57" rx="35" ry="39" fill="#FDDBB4" />

        {/* ── EARS ── */}
        <ellipse cx="25" cy="58" rx="7" ry="9" fill="#FDDBB4" />
        <ellipse cx="95" cy="58" rx="7" ry="9" fill="#FDDBB4" />
        <ellipse cx="25" cy="58" rx="4.5" ry="6" fill="#F5C28A" />
        <ellipse cx="95" cy="58" rx="4.5" ry="6" fill="#F5C28A" />

        {/* ── BANGS ── */}
        <path d="M 26 44 Q 42 18 60 16 Q 78 18 94 44 Q 76 28 60 26 Q 44 28 26 44 Z" fill="#5C3317" />
        <path d="M 26 46 Q 30 32 38 26 Q 30 38 27 52 Z" fill="#5C3317" />
        <path d="M 94 46 Q 90 32 82 26 Q 90 38 93 52 Z" fill="#5C3317" />

        {/* ── LEFT EYE ── */}
        <ellipse cx="44" cy="58" rx="12" ry="14" fill="white" />
        <circle  cx="45" cy="59" r="8.5"         fill="#6B3A1F" />
        <circle  cx="46" cy="59" r="5"            fill="#2C1508" />
        <circle  cx="49" cy="55" r="2.5"          fill="white" />
        <circle  cx="43" cy="62" r="1.2"          fill="white" />
        <path d="M 32 51 Q 44 44 56 51" stroke="#3D2008" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <motion.rect
          x="32" y="44" width="24" height="16" rx="12"
          fill="#FDDBB4"
          animate={{ scaleY: blink ? 1 : 0 }}
          style={{ originY: '44px', originX: '44px' }}
          transition={{ duration: 0.08 }}
        />

        {/* ── RIGHT EYE ── */}
        <ellipse cx="76" cy="58" rx="12" ry="14" fill="white" />
        <circle  cx="77" cy="59" r="8.5"         fill="#6B3A1F" />
        <circle  cx="78" cy="59" r="5"            fill="#2C1508" />
        <circle  cx="81" cy="55" r="2.5"          fill="white" />
        <circle  cx="75" cy="62" r="1.2"          fill="white" />
        <path d="M 64 51 Q 76 44 88 51" stroke="#3D2008" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <motion.rect
          x="64" y="44" width="24" height="16" rx="12"
          fill="#FDDBB4"
          animate={{ scaleY: blink ? 1 : 0 }}
          style={{ originY: '44px', originX: '76px' }}
          transition={{ duration: 0.08 }}
        />

        {/* ── EYEBROWS ── */}
        <motion.path
          d={`M 34 ${44 + browOffset[state]} Q 44 ${38 + browOffset[state]} 54 ${44 + browOffset[state]}`}
          stroke="#3D2008" strokeWidth="2.5" fill="none" strokeLinecap="round"
          animate={{ d: `M 34 ${44 + browOffset[state]} Q 44 ${38 + browOffset[state]} 54 ${44 + browOffset[state]}` }}
          transition={{ duration: 0.25 }}
        />
        <motion.path
          d={`M 66 ${44 + browOffset[state]} Q 76 ${38 + browOffset[state]} 86 ${44 + browOffset[state]}`}
          stroke="#3D2008" strokeWidth="2.5" fill="none" strokeLinecap="round"
          animate={{ d: `M 66 ${44 + browOffset[state]} Q 76 ${38 + browOffset[state]} 86 ${44 + browOffset[state]}` }}
          transition={{ duration: 0.25 }}
        />

        {/* ── BLUSH ── */}
        <ellipse cx="27" cy="68" rx="10" ry="6" fill="#FFB6C1" opacity="0.55" />
        <ellipse cx="93" cy="68" rx="10" ry="6" fill="#FFB6C1" opacity="0.55" />

        {/* ── NOSE ── */}
        <ellipse cx="60" cy="73" rx="2.5" ry="1.8" fill="#F5C28A" />

        {/* ── MOUTH ── */}
        <motion.path
          d={mouths[state]}
          fill="none" stroke="#C96A45" strokeWidth="2.5" strokeLinecap="round"
          animate={{ d: mouths[state] }}
          transition={{ duration: 0.3 }}
        />

        {/* ── NECK ── */}
        <rect x="52" y="92" width="16" height="14" rx="4" fill="#FDDBB4" />

        {/* ── BODY / SWEATER ── */}
        <rect x="26" y="102" width="68" height="58" rx="22" fill="#A34E30" />
        <path d="M 44 102 Q 60 116 76 102" fill="#8B3A1C" />
        <path d="M 32 110 Q 52 105 60 107 Q 52 112 32 116 Z" fill="rgba(255,255,255,0.12)" />
        {/* Heart */}
        <path
          d="M 60 128 C 60 128 51 121 51 116 C 51 113 54.5 111.5 57.5 114 C 58.8 115 60 117 60 117 C 60 117 61.2 115 62.5 114 C 65.5 111.5 69 113 69 116 C 69 121 60 128 60 128 Z"
          fill="#C96A45"
        />

        {/* ── RIGHT ARM + NOTEBOOK ── */}
        <path d="M 90 118 Q 108 130 108 148" stroke="#A34E30" strokeWidth="14" fill="none" strokeLinecap="round" />
        <circle cx="108" cy="148" r="7" fill="#FDDBB4" />
        {/* Notebook */}
        <rect x="90" y="120" width="28" height="30" rx="4" fill="#F4A5B8" />
        <rect x="90" y="120" width="6"  height="30" rx="3" fill="#E87FA0" />
        <line x1="99" y1="128" x2="115" y2="128" stroke="white" strokeWidth="1.5" opacity="0.8" />
        <line x1="99" y1="134" x2="115" y2="134" stroke="white" strokeWidth="1.5" opacity="0.8" />
        <line x1="99" y1="140" x2="115" y2="140" stroke="white" strokeWidth="1.5" opacity="0.8" />
        <line x1="99" y1="145" x2="110" y2="145" stroke="white" strokeWidth="1.5" opacity="0.8" />

        {/* ── LEFT ARM + PENCIL (animated) ── */}
        <motion.g
          variants={pencilVariants}
          animate={prefersReduced ? {} : state}
          style={{ originX: '12px', originY: '132px' }}
        >
          <path d="M 30 118 Q 12 130 12 148" stroke="#A34E30" strokeWidth="14" fill="none" strokeLinecap="round" />
          <circle cx="12" cy="148" r="7" fill="#FDDBB4" />
          {/* Pencil */}
          <g transform="rotate(28 8 134)">
            <rect x="5"  y="112" width="6" height="4"  rx="2"   fill="#FFA0A0" />
            <rect x="5.5" y="115" width="5" height="2.5" rx="0" fill="#BBBBBB" />
            <rect x="5"  y="117" width="6" height="22" rx="1"   fill="#F5C842" />
            <path d="M 5 139 L 8 147 L 11 139 Z"              fill="#FDDBB4" />
            <path d="M 6.5 143 L 8 147 L 9.5 143 Z"           fill="#2C1508" />
          </g>
        </motion.g>
      </motion.g>
    </svg>
  );
}
