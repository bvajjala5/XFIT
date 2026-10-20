import React from 'react';

const curlMotion = `
  @keyframes left-curl {
    0%, 12%, 100% { transform: rotate(0deg); }
    42%, 62% { transform: rotate(-118deg); }
  }
  @keyframes right-curl {
    0%, 12%, 100% { transform: rotate(0deg); }
    42%, 62% { transform: rotate(118deg); }
  }
  .custom-curl-left {
    transform-box: view-box;
    transform-origin: 82px 139px;
    animation: left-curl 2.6s ease-in-out infinite;
  }
  .custom-curl-right {
    transform-box: view-box;
    transform-origin: 278px 139px;
    animation: right-curl 2.6s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .custom-curl-left, .custom-curl-right { animation: none; }
  }
`;

function Dumbbell({ x = 0, y = 0 }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="#11131d" strokeWidth="2.5" strokeLinejoin="round">
      <rect x="-20" y="-3" width="40" height="6" rx="3" fill="#9aa4b8" />
      <rect x="-29" y="-11" width="9" height="22" rx="3" fill="#677187" />
      <rect x="20" y="-11" width="9" height="22" rx="3" fill="#677187" />
      <path d="M-27 -7h5M22 -7h5" stroke="#c7d0df" strokeWidth="1.5" />
    </g>
  );
}

export default function CustomBicepCurlDemo() {
  return (
    <div className="w-full max-w-sm mx-auto space-y-2">
      <div className="w-full aspect-[3/2] overflow-hidden rounded-2xl bg-black/30">
        <svg
          viewBox="0 0 360 240"
          className="h-full w-full"
          role="img"
          aria-label="Cartoon version of your hooded avatar demonstrating dumbbell bicep curls"
        >
          <defs>
            <linearGradient id="curl-bg" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#11182b" />
              <stop offset="1" stopColor="#080a13" />
            </linearGradient>
            <radialGradient id="curl-glow">
              <stop stopColor="#6c63ff" stopOpacity=".24" />
              <stop offset="1" stopColor="#6c63ff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="hoodie" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#252630" />
              <stop offset=".55" stopColor="#101116" />
              <stop offset="1" stopColor="#292a33" />
            </linearGradient>
            <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#b87552" />
              <stop offset=".5" stopColor="#8c5038" />
              <stop offset="1" stopColor="#5d3429" />
            </linearGradient>
            <linearGradient id="hood" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#30313b" />
              <stop offset="1" stopColor="#111218" />
            </linearGradient>
          </defs>

          <rect width="360" height="240" fill="url(#curl-bg)" />
          <ellipse cx="180" cy="118" rx="138" ry="122" fill="url(#curl-glow)" />
          <path d="M22 208h316" stroke="#39405a" strokeOpacity=".5" />
          <circle cx="45" cy="43" r="1.5" fill="#aab2df" opacity=".45" />
          <circle cx="311" cy="61" r="1.2" fill="#aab2df" opacity=".4" />
          <circle cx="292" cy="31" r="1" fill="#aab2df" opacity=".35" />

          {/* Torso and hood echo the dark sleeveless outfit in the avatar reference. */}
          <path d="M137 77 115 90q-15 8-19 25l-12 91q96 22 192 0l-12-91q-4-17-19-25l-22-13Z" fill="url(#hoodie)" stroke="#454650" strokeWidth="3" />
          <path d="M136 80q-14 8-19 26l-9 52q21 11 39 7l6-67Zm88 0q14 8 19 26l9 52q-21 11-39 7l-6-67Z" fill="#0b0c11" stroke="#373841" strokeWidth="2" />
          <path d="M160 110q20 10 40 0l-5 36q-15 12-30 0Z" fill="#171820" stroke="#3a3b45" strokeWidth="2" />
          <path d="M164 129q-10-8-16-2 5 12 18 9m30-7q10-8 16-2-5 12-18 9" fill="none" stroke="#6d7080" strokeWidth="3" strokeLinecap="round" opacity=".8" />
          <path d="M174 207v18m12-18v18" stroke="#343643" strokeWidth="5" strokeLinecap="round" />

          {/* Hood stays shadowed, matching the reference avatar's covered face. */}
          <path d="M142 37q0-34 38-34t38 34l-6 39q-7 21-32 27-25-6-32-27Z" fill="url(#hood)" stroke="#50515c" strokeWidth="3" />
          <path d="M153 47q1-25 27-26t27 26l-5 20q-7 13-22 17-15-4-22-17Z" fill="#05060a" />
          <path d="M143 75q37 16 74 0l-8 15q-29 14-58 0Z" fill="#171820" stroke="#3a3b45" strokeWidth="2" />

          {/* Fixed upper arms keep the shoulder line steady as the forearms curl. */}
          <path d="M124 91q-24-7-45 5-24 15-24 32 0 13 15 18 14 4 28-8l30-22Z" fill="url(#skin)" stroke="#d29a78" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M236 91q24-7 45 5 24 15 24 32 0 13-15 18-14 4-28-8l-30-22Z" fill="url(#skin)" stroke="#d29a78" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M67 126q11-12 25-12m-19 30q13 2 24-8M293 126q-11-12-25-12m19 30q-13 2-24-8" fill="none" stroke="#e1a886" strokeWidth="2" strokeLinecap="round" opacity=".65" />

          {/* Forearms, hands, and weights rotate around each elbow. */}
          <g className="custom-curl-left">
            <path d="M82 136q-15 10-19 26l5 27q2 12 16 13 13 0 17-12l2-26q-1-17-12-27Z" fill="url(#skin)" stroke="#d29a78" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M68 169q12 7 29 1m-25 17q10 5 26 1" fill="none" stroke="#e1a886" strokeWidth="2" strokeLinecap="round" opacity=".62" />
            <path d="M72 196q10 8 22 1l5 8q-12 12-28 3Z" fill="#20212b" stroke="#41434e" strokeWidth="2" />
            <Dumbbell x={82} y={216} />
          </g>
          <g className="custom-curl-right">
            <path d="M278 136q15 10 19 26l-5 27q-2 12-16 13-13 0-17-12l-2-26q1-17 12-27Z" fill="url(#skin)" stroke="#d29a78" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M292 169q-12 7-29 1m25 17q-10 5-26 1" fill="none" stroke="#e1a886" strokeWidth="2" strokeLinecap="round" opacity=".62" />
            <path d="M288 196q-10 8-22 1l-5 8q12 12 28 3Z" fill="#20212b" stroke="#41434e" strokeWidth="2" />
            <Dumbbell x={278} y={216} />
          </g>
        </svg>
      </div>
      <style>{curlMotion}</style>
      <p className="text-[10px] text-center text-muted-foreground">Custom avatar · Bicep curl demo</p>
    </div>
  );
}
