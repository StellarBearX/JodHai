interface AvatarProps { size?: number }

// 1 — หมี (Bear)
export function AvatarBear({ size = 64 }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#C6855A" />
      {/* ears */}
      <circle cx="13" cy="14" r="9" fill="#A3633A" />
      <circle cx="51" cy="14" r="9" fill="#A3633A" />
      <circle cx="13" cy="14" r="5" fill="#D4956E" />
      <circle cx="51" cy="14" r="5" fill="#D4956E" />
      {/* face base */}
      <circle cx="32" cy="35" r="20" fill="#D4956E" />
      {/* muzzle */}
      <ellipse cx="32" cy="42" rx="9" ry="6" fill="#C6855A" />
      {/* eyes */}
      <circle cx="25" cy="33" r="3.5" fill="#2C1508" />
      <circle cx="39" cy="33" r="3.5" fill="#2C1508" />
      <circle cx="26.2" cy="31.8" r="1.2" fill="white" />
      <circle cx="40.2" cy="31.8" r="1.2" fill="white" />
      {/* nose */}
      <ellipse cx="32" cy="40" rx="3" ry="2" fill="#2C1508" />
      {/* smile */}
      <path d="M28 44 Q32 47 36 44" stroke="#2C1508" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 2 — แมว (Cat)
export function AvatarCat({ size = 64 }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#7B8EC8" />
      {/* ears */}
      <polygon points="10,20 18,6 22,22" fill="#5A6DAF" />
      <polygon points="54,20 46,6 42,22" fill="#5A6DAF" />
      <polygon points="12,20 18,9 21,21" fill="#C9A8D4" />
      <polygon points="52,20 46,9 43,21" fill="#C9A8D4" />
      {/* face */}
      <circle cx="32" cy="36" r="20" fill="#9BABD8" />
      {/* muzzle */}
      <ellipse cx="32" cy="42" rx="8" ry="5" fill="#B8C4E8" />
      {/* eyes */}
      <ellipse cx="25" cy="33" rx="3" ry="3.5" fill="#2C1508" />
      <ellipse cx="39" cy="33" rx="3" ry="3.5" fill="#2C1508" />
      <circle cx="25.8" cy="31.5" r="1.2" fill="white" />
      <circle cx="39.8" cy="31.5" r="1.2" fill="white" />
      {/* nose */}
      <polygon points="32,39 30,41 34,41" fill="#E8A0C0" />
      {/* whiskers */}
      <line x1="15" y1="41" x2="26" y2="42" stroke="#5A6DAF" strokeWidth="1" strokeLinecap="round" />
      <line x1="15" y1="44" x2="26" y2="44" stroke="#5A6DAF" strokeWidth="1" strokeLinecap="round" />
      <line x1="38" y1="42" x2="49" y2="41" stroke="#5A6DAF" strokeWidth="1" strokeLinecap="round" />
      <line x1="38" y1="44" x2="49" y2="44" stroke="#5A6DAF" strokeWidth="1" strokeLinecap="round" />
      {/* smile */}
      <path d="M29 44 Q32 47 35 44" stroke="#2C1508" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 3 — กระต่าย (Bunny)
export function AvatarBunny({ size = 64 }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#E8C4D4" />
      {/* ears */}
      <ellipse cx="20" cy="10" rx="6" ry="13" fill="#F0D8E4" />
      <ellipse cx="44" cy="10" rx="6" ry="13" fill="#F0D8E4" />
      <ellipse cx="20" cy="10" rx="3.5" ry="10" fill="#E8A0BE" />
      <ellipse cx="44" cy="10" rx="3.5" ry="10" fill="#E8A0BE" />
      {/* face */}
      <circle cx="32" cy="36" r="20" fill="#F5DDE8" />
      {/* muzzle */}
      <ellipse cx="32" cy="43" rx="8" ry="5" fill="#F0D0DF" />
      {/* eyes */}
      <circle cx="25" cy="33" r="3.5" fill="#2C1508" />
      <circle cx="39" cy="33" r="3.5" fill="#2C1508" />
      <circle cx="26.2" cy="31.8" r="1.2" fill="white" />
      <circle cx="40.2" cy="31.8" r="1.2" fill="white" />
      {/* nose */}
      <ellipse cx="32" cy="40.5" rx="2.5" ry="1.8" fill="#E8A0BE" />
      {/* smile */}
      <path d="M29 43.5 Q32 46.5 35 43.5" stroke="#B06080" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <line x1="32" y1="42" x2="32" y2="43.5" stroke="#B06080" strokeWidth="1.2" />
    </svg>
  );
}

// 4 — จิ้งจอก (Fox)
export function AvatarFox({ size = 64 }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#E8874A" />
      {/* ears */}
      <polygon points="11,22 17,5 26,20" fill="#D46A2A" />
      <polygon points="53,22 47,5 38,20" fill="#D46A2A" />
      <polygon points="13,21 17,8 24,20" fill="#F5C08A" />
      <polygon points="51,21 47,8 40,20" fill="#F5C08A" />
      {/* white face patch */}
      <ellipse cx="32" cy="38" rx="14" ry="16" fill="#F5DDB0" />
      {/* orange forehead */}
      <ellipse cx="32" cy="27" rx="13" ry="10" fill="#E8874A" />
      {/* muzzle */}
      <ellipse cx="32" cy="43" rx="8" ry="5.5" fill="#F5DDB0" />
      {/* eyes */}
      <circle cx="25" cy="33" r="3.5" fill="#2C1508" />
      <circle cx="39" cy="33" r="3.5" fill="#2C1508" />
      <circle cx="26.2" cy="31.8" r="1.2" fill="white" />
      <circle cx="40.2" cy="31.8" r="1.2" fill="white" />
      {/* nose */}
      <ellipse cx="32" cy="40.5" rx="2.5" ry="1.8" fill="#2C1508" />
      {/* smile */}
      <path d="M28.5 44 Q32 47 35.5 44" stroke="#2C1508" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 5 — แพนด้า (Panda)
export function AvatarPanda({ size = 64 }: AvatarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill="#F0EDE8" />
      {/* ears */}
      <circle cx="14" cy="15" r="9" fill="#2C2C2C" />
      <circle cx="50" cy="15" r="9" fill="#2C2C2C" />
      {/* face */}
      <circle cx="32" cy="35" r="20" fill="#F5F2EE" />
      {/* eye patches */}
      <ellipse cx="24.5" cy="32" rx="6" ry="6" fill="#2C2C2C" />
      <ellipse cx="39.5" cy="32" rx="6" ry="6" fill="#2C2C2C" />
      {/* eyes */}
      <circle cx="24.5" cy="32" r="3.5" fill="#1A1A1A" />
      <circle cx="39.5" cy="32" r="3.5" fill="#1A1A1A" />
      <circle cx="25.7" cy="30.8" r="1.3" fill="white" />
      <circle cx="40.7" cy="30.8" r="1.3" fill="white" />
      {/* muzzle */}
      <ellipse cx="32" cy="42" rx="8" ry="5.5" fill="#E8E0D8" />
      {/* nose */}
      <ellipse cx="32" cy="39.5" rx="2.5" ry="1.8" fill="#2C2C2C" />
      {/* smile */}
      <path d="M28.5 44 Q32 47 35.5 44" stroke="#2C2C2C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export const AVATARS = [AvatarBear, AvatarCat, AvatarBunny, AvatarFox, AvatarPanda];
export const AVATAR_NAMES = ['หมี', 'แมว', 'กระต่าย', 'จิ้งจอก', 'แพนด้า'];
