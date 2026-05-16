import React from 'react';

function getModelKey(name = '') {
  const n = name.toLowerCase();
  if (n.includes('bicep curl')||n.includes('hammer curl')) return 'curl';
  if (n.includes('push-up')||n.includes('pushup')||n.includes('diamond push')) return 'push_up';
  if (n.includes('squat')||n.includes('bulgarian')) return 'squat';
  if (n.includes('lateral raise')) return 'lateral_raise';
  if (n.includes('plank')||n.includes('ab hold')) return 'plank';
  if (n.includes('lunge')||n.includes('split squat')) return 'lunge';
  if (n.includes('russian twist')) return 'russian_twist';
  if (n.includes('hip raise')||n.includes('bridge')) return 'hip_raise';
  if (n.includes('overhead')||n.includes('ground to overhead')) return 'overhead_press';
  if (n.includes('jump')||n.includes('jumping')) return 'jump';
  return 'default';
}

const MODIFIER_LABELS = { push_up:'On Knees', squat:'Shallow Squat', curl:'Seated', lunge:'No Step', plank:'On Knees' };

function SVGModel({ modelKey, modified = false }) {
  const label = modified ? (MODIFIER_LABELS[modelKey] || 'Reduced Range') : null;
  const color = modified ? '#4b5563' : '#60a5fa';

  const models = {
    curl: (
      <svg width="80" height="100" viewBox="0 0 80 100">
        <style>{`@keyframes curl-arm{0%,100%{transform-origin:40px 55px;transform:rotate(0deg)}50%{transform-origin:40px 55px;transform:rotate(-60deg)}}.curl-arm{animation:curl-arm 1.4s ease-in-out infinite}`}</style>
        <circle cx="40" cy="18" r="8" fill="none" stroke={color} strokeWidth="2.5"/>
        <line x1="40" y1="26" x2="40" y2="60" stroke={color} strokeWidth="2.5"/>
        <line x1="40" y1="36" x2="22" y2="50" stroke={color} strokeWidth="2.5"/>
        <g className="curl-arm"><line x1="40" y1="36" x2="58" y2="50" stroke={color} strokeWidth="2.5"/><line x1="58" y1="50" x2="62" y2="68" stroke={color} strokeWidth="2.5"/></g>
        <line x1="40" y1="60" x2="30" y2="78" stroke={color} strokeWidth="2.5"/><line x1="30" y1="78" x2="26" y2="95" stroke={color} strokeWidth="2.5"/>
        <line x1="40" y1="60" x2="50" y2="78" stroke={color} strokeWidth="2.5"/><line x1="50" y1="78" x2="54" y2="95" stroke={color} strokeWidth="2.5"/>
      </svg>
    ),
    push_up: (
      <svg width="100" height="70" viewBox="0 0 100 70">
        <style>{`@keyframes pushup{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}.pushup-body{animation:pushup 1.4s ease-in-out infinite}`}</style>
        <g className="pushup-body">
          <circle cx="82" cy="22" r="7" fill="none" stroke={color} strokeWidth="2.5"/>
          <line x1="30" y1="32" x2="75" y2="32" stroke={color} strokeWidth="2.5"/>
          <line x1="70" y1="32" x2="70" y2="50" stroke={color} strokeWidth="2.5"/>
          <line x1="40" y1="32" x2="40" y2="50" stroke={color} strokeWidth="2.5"/>
          {modified ? <><line x1="30" y1="32" x2="18" y2="45" stroke={color} strokeWidth="2.5"/><line x1="18" y1="45" x2="18" y2="55" stroke={color} strokeWidth="2.5"/></> : <><line x1="30" y1="32" x2="15" y2="44" stroke={color} strokeWidth="2.5"/><line x1="15" y1="44" x2="12" y2="56" stroke={color} strokeWidth="2.5"/></>}
        </g>
      </svg>
    ),
    squat: (
      <svg width="80" height="110" viewBox="0 0 80 110">
        <style>{`@keyframes squat-full{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(14px) scaleY(0.82)}}@keyframes squat-shallow{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(7px) scaleY(0.92)}}.squat-body{transform-origin:40px 18px;animation:${modified?'squat-shallow':'squat-full'} 1.6s ease-in-out infinite}`}</style>
        <g className="squat-body">
          <circle cx="40" cy="18" r="8" fill="none" stroke={color} strokeWidth="2.5"/>
          <line x1="40" y1="26" x2="40" y2="62" stroke={color} strokeWidth="2.5"/>
          <line x1="40" y1="36" x2="18" y2="50" stroke={color} strokeWidth="2.5"/>
          <line x1="40" y1="36" x2="62" y2="50" stroke={color} strokeWidth="2.5"/>
          <line x1="40" y1="62" x2="26" y2="80" stroke={color} strokeWidth="2.5"/><line x1="26" y1="80" x2="22" y2="98" stroke={color} strokeWidth="2.5"/>
          <line x1="40" y1="62" x2="54" y2="80" stroke={color} strokeWidth="2.5"/><line x1="54" y1="80" x2="58" y2="98" stroke={color} strokeWidth="2.5"/>
        </g>
      </svg>
    ),
    lateral_raise: (
      <svg width="80" height="110" viewBox="0 0 80 110">
        <style>{`@keyframes lat-raise{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-70deg)}}@keyframes lat-raise-r{0%,100%{transform:rotate(0deg)}50%{transform:rotate(70deg)}}.lat-l{transform-origin:40px 36px;animation:lat-raise 1.4s ease-in-out infinite}.lat-r{transform-origin:40px 36px;animation:lat-raise-r 1.4s ease-in-out infinite}`}</style>
        <circle cx="40" cy="18" r="8" fill="none" stroke={color} strokeWidth="2.5"/>
        <line x1="40" y1="26" x2="40" y2="60" stroke={color} strokeWidth="2.5"/>
        <g className="lat-l"><line x1="40" y1="36" x2="18" y2="50" stroke={color} strokeWidth="2.5"/></g>
        <g className="lat-r"><line x1="40" y1="36" x2="62" y2="50" stroke={color} strokeWidth="2.5"/></g>
        <line x1="40" y1="60" x2="28" y2="80" stroke={color} strokeWidth="2.5"/><line x1="28" y1="80" x2="24" y2="98" stroke={color} strokeWidth="2.5"/>
        <line x1="40" y1="60" x2="52" y2="80" stroke={color} strokeWidth="2.5"/><line x1="52" y1="80" x2="56" y2="98" stroke={color} strokeWidth="2.5"/>
      </svg>
    ),
    plank: (
      <svg width="110" height="60" viewBox="0 0 110 60">
        <style>{`@keyframes plank-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}.plank-body{animation:plank-bob 2s ease-in-out infinite}`}</style>
        <g className="plank-body">
          <circle cx="90" cy="18" r="7" fill="none" stroke={color} strokeWidth="2.5"/>
          <line x1="28" y1="30" x2="83" y2="30" stroke={color} strokeWidth="2.5"/>
          {modified ? <><line x1="28" y1="30" x2="20" y2="42" stroke={color} strokeWidth="2.5"/><line x1="45" y1="30" x2="45" y2="46" stroke={color} strokeWidth="2.5"/></> : <><line x1="28" y1="30" x2="20" y2="46" stroke={color} strokeWidth="2.5"/><line x1="40" y1="30" x2="32" y2="46" stroke={color} strokeWidth="2.5"/></>}
          <line x1="80" y1="30" x2="80" y2="48" stroke={color} strokeWidth="2.5"/>
        </g>
      </svg>
    ),
    lunge: (
      <svg width="90" height="110" viewBox="0 0 90 110">
        <style>{`@keyframes lunge-step{0%,100%{transform:translateX(0)}50%{transform:translateX(12px)}}.lunge-leg{animation:lunge-step 1.6s ease-in-out infinite}`}</style>
        <circle cx="45" cy="18" r="8" fill="none" stroke={color} strokeWidth="2.5"/>
        <line x1="45" y1="26" x2="45" y2="60" stroke={color} strokeWidth="2.5"/>
        <line x1="45" y1="36" x2="25" y2="50" stroke={color} strokeWidth="2.5"/>
        <line x1="45" y1="36" x2="65" y2="50" stroke={color} strokeWidth="2.5"/>
        <line x1="45" y1="60" x2="28" y2="80" stroke={color} strokeWidth="2.5"/><line x1="28" y1="80" x2="24" y2="100" stroke={color} strokeWidth="2.5"/>
        <g className="lunge-leg"><line x1="45" y1="60" x2="58" y2="78" stroke={color} strokeWidth="2.5"/><line x1="58" y1="78" x2="70" y2="100" stroke={color} strokeWidth="2.5"/></g>
      </svg>
    ),
    russian_twist: (
      <svg width="90" height="90" viewBox="0 0 90 90">
        <style>{`@keyframes rt-twist{0%,100%{transform:rotate(-25deg)}50%{transform:rotate(25deg)}}.rt-upper{transform-origin:45px 55px;animation:rt-twist 1.2s ease-in-out infinite}`}</style>
        <line x1="20" y1="75" x2="70" y2="75" stroke={color} strokeWidth="2.5"/>
        <line x1="20" y1="75" x2="10" y2="85" stroke={color} strokeWidth="2.5"/>
        <line x1="70" y1="75" x2="80" y2="85" stroke={color} strokeWidth="2.5"/>
        <g className="rt-upper">
          <line x1="45" y1="55" x2="45" y2="30" stroke={color} strokeWidth="2.5"/>
          <circle cx="45" cy="22" r="8" fill="none" stroke={color} strokeWidth="2.5"/>
          <line x1="45" y1="38" x2="25" y2="46" stroke={color} strokeWidth="2.5"/>
          <line x1="45" y1="38" x2="65" y2="46" stroke={color} strokeWidth="2.5"/>
        </g>
      </svg>
    ),
    hip_raise: (
      <svg width="110" height="80" viewBox="0 0 110 80">
        <style>{`@keyframes hip-up{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}.hip-mid{transform-origin:55px 55px;animation:hip-up 1.5s ease-in-out infinite}`}</style>
        <circle cx="90" cy="48" r="7" fill="none" stroke={color} strokeWidth="2.5"/>
        <line x1="75" y1="55" x2="30" y2="55" stroke={color} strokeWidth="2.5"/>
        <g className="hip-mid">
          <line x1="75" y1="55" x2="55" y2="40" stroke={color} strokeWidth="2.5"/>
          <line x1="30" y1="55" x2="18" y2="40" stroke={color} strokeWidth="2.5"/>
        </g>
        <line x1="55" y1="65" x2="55" y2="72" stroke={color} strokeWidth="2.5"/>
        <line x1="18" y1="65" x2="18" y2="72" stroke={color} strokeWidth="2.5"/>
      </svg>
    ),
    overhead_press: (
      <svg width="80" height="120" viewBox="0 0 80 120">
        <style>{`@keyframes ohp{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}.ohp-arms{animation:ohp 1.4s ease-in-out infinite}`}</style>
        <circle cx="40" cy="18" r="8" fill="none" stroke={color} strokeWidth="2.5"/>
        <line x1="40" y1="26" x2="40" y2="65" stroke={color} strokeWidth="2.5"/>
        <g className="ohp-arms">
          <line x1="40" y1="36" x2="16" y2="46" stroke={color} strokeWidth="2.5"/><line x1="16" y1="46" x2="10" y2="28" stroke={color} strokeWidth="2.5"/>
          <line x1="40" y1="36" x2="64" y2="46" stroke={color} strokeWidth="2.5"/><line x1="64" y1="46" x2="70" y2="28" stroke={color} strokeWidth="2.5"/>
        </g>
        <line x1="40" y1="65" x2="28" y2="85" stroke={color} strokeWidth="2.5"/><line x1="28" y1="85" x2="24" y2="105" stroke={color} strokeWidth="2.5"/>
        <line x1="40" y1="65" x2="52" y2="85" stroke={color} strokeWidth="2.5"/><line x1="52" y1="85" x2="56" y2="105" stroke={color} strokeWidth="2.5"/>
      </svg>
    ),
    jump: (
      <svg width="90" height="120" viewBox="0 0 90 120">
        <style>{`@keyframes jj-arms{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-70deg)}}@keyframes jj-arms-r{0%,100%{transform:rotate(0deg)}50%{transform:rotate(70deg)}}@keyframes jj-legs{0%,100%{transform:rotate(0deg)}50%{transform:rotate(20deg)}}@keyframes jj-legs-r{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-20deg)}}@keyframes jj-jump{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}.jj-body{animation:jj-jump 0.8s ease-in-out infinite}.jj-al{transform-origin:45px 40px;animation:jj-arms 0.8s ease-in-out infinite}.jj-ar{transform-origin:45px 40px;animation:jj-arms-r 0.8s ease-in-out infinite}.jj-ll{transform-origin:45px 68px;animation:jj-legs 0.8s ease-in-out infinite}.jj-lr{transform-origin:45px 68px;animation:jj-legs-r 0.8s ease-in-out infinite}`}</style>
        <g className="jj-body">
          <circle cx="45" cy="18" r="8" fill="none" stroke={color} strokeWidth="2.5"/>
          <line x1="45" y1="26" x2="45" y2="68" stroke={color} strokeWidth="2.5"/>
          <g className="jj-al"><line x1="45" y1="40" x2="22" y2="54" stroke={color} strokeWidth="2.5"/></g>
          <g className="jj-ar"><line x1="45" y1="40" x2="68" y2="54" stroke={color} strokeWidth="2.5"/></g>
          <g className="jj-ll"><line x1="45" y1="68" x2="26" y2="92" stroke={color} strokeWidth="2.5"/></g>
          <g className="jj-lr"><line x1="45" y1="68" x2="64" y2="92" stroke={color} strokeWidth="2.5"/></g>
        </g>
      </svg>
    ),
    default: (
      <svg width="80" height="120" viewBox="0 0 80 120">
        <style>{`@keyframes jog-body{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}@keyframes jog-la{0%,100%{transform:rotate(-25deg)}50%{transform:rotate(25deg)}}@keyframes jog-ra{0%,100%{transform:rotate(25deg)}50%{transform:rotate(-25deg)}}@keyframes jog-ll{0%,100%{transform:rotate(-20deg)}50%{transform:rotate(20deg)}}@keyframes jog-rl{0%,100%{transform:rotate(20deg)}50%{transform:rotate(-20deg)}}.jog-b{animation:jog-body 0.5s ease-in-out infinite}.jog-la{transform-origin:40px 38px;animation:jog-la 0.5s ease-in-out infinite}.jog-ra{transform-origin:40px 38px;animation:jog-ra 0.5s ease-in-out infinite}.jog-ll{transform-origin:40px 65px;animation:jog-ll 0.5s ease-in-out infinite}.jog-rl{transform-origin:40px 65px;animation:jog-rl 0.5s ease-in-out infinite}`}</style>
        <g className="jog-b">
          <circle cx="40" cy="18" r="8" fill="none" stroke={color} strokeWidth="2.5"/>
          <line x1="40" y1="26" x2="40" y2="65" stroke={color} strokeWidth="2.5"/>
          <g className="jog-la"><line x1="40" y1="38" x2="22" y2="54" stroke={color} strokeWidth="2.5"/></g>
          <g className="jog-ra"><line x1="40" y1="38" x2="58" y2="54" stroke={color} strokeWidth="2.5"/></g>
          <g className="jog-ll"><line x1="40" y1="65" x2="26" y2="88" stroke={color} strokeWidth="2.5"/></g>
          <g className="jog-rl"><line x1="40" y1="65" x2="54" y2="88" stroke={color} strokeWidth="2.5"/></g>
        </g>
      </svg>
    ),
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {models[modelKey] || models.default}
      {label && <span className="text-[9px] font-semibold text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-full">{label}</span>}
    </div>
  );
}

export default function WorkoutModel({ exerciseName, showModified = false }) {
  const key = getModelKey(exerciseName);
  return (
    <div className="flex items-start justify-around w-full gap-2">
      <div className="flex flex-col items-center gap-1 flex-1">
        <SVGModel modelKey={key} modified={false} />
        <span className="text-[9px] text-muted-foreground font-medium">Standard Form</span>
      </div>
      {showModified && (
        <div className="flex flex-col items-center gap-1 flex-1">
          <SVGModel modelKey={key} modified={true} />
          <span className="text-[9px] text-muted-foreground font-medium">Modified Version</span>
        </div>
      )}
    </div>
  );
}
