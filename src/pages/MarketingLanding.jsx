import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity, ArrowDown, ArrowRight, Check, ChevronDown, Dumbbell, HeartPulse,
  Menu, Play, Smartphone, Sparkles, Timer, TrendingUp, X, Zap,
} from 'lucide-react'
import './MarketingLanding.css'

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
}

function Brand({ light = false }) {
  return <Link to="/" className={`xfit-brand ${light ? 'xfit-brand-light' : ''}`} aria-label="XFIT home">
    <span className="xfit-brand-mark">X</span><span>XFIT<span className="brand-period">.</span></span>
  </Link>
}

export default function MarketingLanding() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installHelp, setInstallHelp] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const capturePrompt = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }
    window.addEventListener('beforeinstallprompt', capturePrompt)
    return () => window.removeEventListener('beforeinstallprompt', capturePrompt)
  }, [])

  const install = async () => {
    if (!installPrompt) {
      setInstallHelp(true)
      return
    }
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  return <main className="marketing-page">
    <div className="marketing-grain" aria-hidden="true" />
    <header className="marketing-nav">
      <div className="marketing-nav-inner">
        <Brand />
        <nav className={`marketing-links ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <a href="#features" onClick={() => setMenuOpen(false)}>The method</a>
          <a href="#inside" onClick={() => setMenuOpen(false)}>Inside XFIT</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
        </nav>
        <div className="nav-actions">
          <Link to="/login" className="nav-signin">Sign in</Link>
          <button className="nav-cta" onClick={install}>Get the app <ArrowDown size={15} /></button>
        </div>
        <button className="nav-menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </header>

    <section className="hero-section">
      <div className="hero-grid marketing-container">
        <motion.div className="hero-copy" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.12 } } }}>
          <motion.div variants={reveal} className="eyebrow"><span className="eyebrow-dot" /> YOUR TRAINING, ALL IN ONE PLACE</motion.div>
          <motion.h1 variants={reveal}>Show up.<br /><span>Get stronger.</span></motion.h1>
          <motion.p variants={reveal} className="hero-lede">Build a routine that sticks. XFIT brings workouts, runs, and everyday progress together—so you can focus on becoming your strongest self.</motion.p>
          <motion.div variants={reveal} className="hero-actions">
            <Link to="/login" className="button-lime">Start your journey <ArrowRight size={17} /></Link>
            <a href="#inside" className="button-quiet"><span className="play-outline"><Play size={13} fill="currentColor" /></span> Take a look</a>
          </motion.div>
          <motion.div variants={reveal} className="hero-proof"><div className="proof-avatars"><span>J</span><span>M</span><span>A</span><span>+</span></div><div><b>Your next rep starts here.</b><small>Free to get started · Made for real life</small></div></motion.div>
        </motion.div>

        <div className="hero-visual" aria-label="XFIT training inspiration">
          <motion.div className="hero-photo-wrap" initial={{ opacity: 0, scale: .94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .9, ease: 'easeOut', delay: .15 }}>
            <img src="/locked-in-cover.png" className="hero-photo" alt="Athlete in a hoodie flexing, with the words Blood, Sweat, Respect" />
            <div className="photo-vignette" />
            <div className="photo-caption"><span>THE WORK IS YOURS</span><i>XFIT / 001</i></div>
          </motion.div>
          <motion.div className="floating-stat" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .7, duration: .6 }}>
            <div className="floating-icon"><TrendingUp size={18} /></div><div><small>ONE DAY AT A TIME</small><b>Progress, your way.</b></div><Sparkles size={17} className="stat-spark" />
          </motion.div>
          <motion.div className="orbit orbit-one" animate={{ rotate: 360 }} transition={{ duration: 48, repeat: Infinity, ease: 'linear' }} />
          <motion.div className="orbit orbit-two" animate={{ rotate: -360 }} transition={{ duration: 65, repeat: Infinity, ease: 'linear' }} />
          <span className="hero-index">01 <span /> 04</span>
        </div>
      </div>
      <div className="hero-bottom marketing-container"><span>FOR THE DAYS YOU FEEL IT. AND THE DAYS YOU DON'T.</span><a href="#features">Scroll to explore <ChevronDown size={15} /></a></div>
    </section>

    <section className="ticker" aria-label="XFIT features">
      <div className="ticker-track">{Array.from({ length: 2 }).map((_, i) => <div className="ticker-set" key={i}><span>TRAIN WITH PURPOSE</span><b>✳</b><span>TRACK YOUR WINS</span><b>✳</b><span>KEEP YOUR PROMISE</span><b>✳</b><span>FIND YOUR PACE</span><b>✳</b></div>)}</div>
    </section>

    <section id="features" className="features-section section-pad">
      <div className="marketing-container">
        <motion.div className="section-heading" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .3 }} variants={reveal}>
          <div className="eyebrow"><span className="eyebrow-dot" /> ONE APP. YOUR WHOLE ROUTINE.</div>
          <h2>Make every<br /><span>move count.</span></h2>
          <p>Less bouncing between apps. More time doing the thing. XFIT keeps your training and momentum in one simple place.</p>
        </motion.div>
        <div className="feature-grid">
          {[
            { number: '01', icon: Dumbbell, title: 'Train with a plan', text: 'Find guided workouts, follow exercise demos, and build sessions that fit your goals.', tag: 'WORKOUTS' },
            { number: '02', icon: Activity, title: 'Move at your pace', text: 'Log your runs, keep an eye on your activity, and celebrate the distance you cover.', tag: 'RUN + ACTIVITY' },
            { number: '03', icon: HeartPulse, title: 'See your progress', text: 'Track the small wins and personal records that add up to something big.', tag: 'YOUR JOURNEY' },
          ].map(({ number, icon: Icon, title, text, tag }, index) => <motion.article key={number} className="feature-card" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} variants={reveal} transition={{ delay: index * .1 }}>
            <div className="feature-card-top"><span>{number} / 03</span><span className="feature-icon"><Icon size={21} /></span></div>
            <div className="feature-illustration"><div className={`feature-orb orb-${index}`}><Icon size={37} strokeWidth={1.25} /></div><span className="feature-tag">{tag}</span><div className="illustration-line line-a" /><div className="illustration-line line-b" /></div>
            <h3>{title}</h3><p>{text}</p><span className="feature-arrow"><ArrowRight size={17} /></span>
          </motion.article>)}
        </div>
      </div>
    </section>

    <section id="inside" className="inside-section section-pad">
      <div className="inside-glow" />
      <div className="inside-grid marketing-container">
        <motion.div className="inside-copy" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .3 }} variants={{ visible: { transition: { staggerChildren: .12 } } }}>
          <motion.div variants={reveal} className="eyebrow"><span className="eyebrow-dot" /> YOUR POCKET TRAINING PARTNER</motion.div>
          <motion.h2 variants={reveal}>Built around<br />the <span>way you move.</span></motion.h2>
          <motion.p variants={reveal}>A clean, focused space to plan a workout, log a run, and check in with your progress. No perfect routine required—just start where you are.</motion.p>
          <motion.ul variants={reveal} className="inside-checks">
            <li><Check size={16} /> Guided exercise demos</li>
            <li><Check size={16} /> Workout and run tracking</li>
            <li><Check size={16} /> Progress, records, and streaks</li>
          </motion.ul>
          <motion.div variants={reveal}><Link to="/login" className="button-lime">Get started for free <ArrowRight size={17} /></Link></motion.div>
        </motion.div>
        <motion.div className="app-preview-scene" initial={{ opacity: 0, y: 35, rotate: 2 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .8, ease: 'easeOut' }}>
          <div className="preview-glow" />
          <div className="preview-phone">
            <div className="phone-top"><span>9:41</span><span className="phone-notch" /><span className="phone-status">●●● ▰</span></div>
            <div className="phone-content">
              <div className="phone-greeting"><div><small>MONDAY, OCTOBER 18</small><b>Let’s get after it.</b></div><div className="phone-avatar">X</div></div>
              <div className="phone-streak"><div className="streak-flame">✳</div><div><small>YOUR STREAK</small><b>4 <em>days</em></b></div><div className="streak-bars"><i /><i /><i /><i className="bar-today" /><i /><i /><i /></div></div>
              <div className="phone-label">TODAY’S FOCUS <span>SEE ALL ↗</span></div>
              <div className="phone-workout"><div className="workout-photo"><img src="/locked-in-cover.png" alt="XFIT athlete" /><span><Play size={12} fill="currentColor" /></span></div><div className="workout-info"><small>STRENGTH · 35 MIN</small><b>Upper body<br />builder</b><div><span><Dumbbell size={12} /> 6 exercises</span><span><Timer size={12} /> 35 min</span></div></div></div>
              <div className="phone-week"><div className="week-head"><b>Your week</b><span>THIS WEEK</span></div><div className="week-days">{[['M','✓'],['T','✓'],['W','•'],['T','•'],['F',''],['S',''],['S','']].map(([day, mark], i) => <div key={i} className={mark === '✓' ? 'done' : mark === '•' ? 'current' : ''}><small>{day}</small><b>{mark || '·'}</b></div>)}</div></div>
              <button className="phone-start"><Zap size={14} fill="currentColor" /> Start today’s workout</button>
            </div>
          </div>
          <motion.div className="preview-float float-record" animate={{ y: [0, -8, 0] }} transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}><span>✦</span><div><small>PERSONAL BEST</small><b>New record unlocked</b></div></motion.div>
          <motion.div className="preview-float float-routine" animate={{ y: [0, 7, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: .4 }}><Activity size={16} /><div><small>KEEP IT ROLLING</small><b>One rep at a time</b></div></motion.div>
        </motion.div>
      </div>
    </section>

    <section className="manifesto-section">
      <div className="manifesto-image"><img src="/locked-in-cover.png" alt="Athlete staying committed to the work" /></div>
      <div className="manifesto-overlay" />
      <motion.div className="manifesto-copy marketing-container" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .4 }} variants={reveal}>
        <span className="manifesto-kicker">NOT A QUICK FIX. A PRACTICE.</span>
        <h2>Consistency<br />looks good<br /><i>on you.</i></h2>
        <Link to="/login" className="manifesto-link">Make your next move <ArrowRight size={17} /></Link>
      </motion.div>
      <span className="manifesto-side">BLOOD · SWEAT · RESPECT</span>
    </section>

    <section id="faq" className="faq-section section-pad">
      <div className="marketing-container faq-grid">
        <div className="faq-title"><div className="eyebrow"><span className="eyebrow-dot" /> GOOD TO KNOW</div><h2>Start with<br /><span>the basics.</span></h2><p>Got a question? Here are a few quick answers.</p></div>
        <div className="faq-list">
          <details><summary>Is XFIT free to use?<ChevronDown size={18} /></summary><p>Yes. You can get started with XFIT for free by signing in with Google.</p></details>
          <details><summary>Can I install it on my phone?<ChevronDown size={18} /></summary><p>XFIT is a web app that you can add to your home screen from your browser. On iPhone, open the page in Safari and choose Share → Add to Home Screen. On Android, open the browser menu and choose Install app or Add to Home screen.</p></details>
          <details><summary>What can I track with XFIT?<ChevronDown size={18} /></summary><p>Workouts, runs, activity, personal records, and your progress over time. You can explore the app after signing in.</p></details>
        </div>
      </div>
    </section>

    <section className="final-cta">
      <div className="final-cta-lines" />
      <motion.div className="final-cta-content" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .5 }} variants={reveal}>
        <span className="eyebrow"><span className="eyebrow-dot" /> YOU DON'T NEED A PERFECT PLAN</span>
        <h2>Just your<br /><span>next move.</span></h2>
        <p>Start small. Keep showing up. Let’s see where you can go.</p>
        <div className="final-buttons"><Link to="/login" className="button-dark">Start with XFIT <ArrowRight size={17} /></Link><button className="button-outline" onClick={install}><Smartphone size={16} /> Install the app</button></div>
      </motion.div>
      <div className="cta-watermark">X</div>
    </section>

    <footer className="marketing-footer"><div className="marketing-container footer-main"><Brand light /><p>Show up. Get stronger.</p><div className="footer-links"><a href="#features">Features</a><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/login">Sign in</Link></div><span className="footer-copy">© {new Date().getFullYear()} XFIT</span></div></footer>

    <AnimatePresence>
      {installHelp && <motion.div className="install-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && setInstallHelp(false)}>
        <motion.div className="install-modal" role="dialog" aria-modal="true" aria-labelledby="install-title" initial={{ y: 24, opacity: 0, scale: .97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0 }}>
          <button className="modal-close" aria-label="Close" onClick={() => setInstallHelp(false)}><X size={18} /></button>
          <div className="modal-mark"><Smartphone size={24} /></div><span className="eyebrow"><span className="eyebrow-dot" /> TAKE XFIT WITH YOU</span>
          <h2 id="install-title">Add XFIT to<br />your home screen.</h2>
          <p>XFIT installs from your browser—no app store download needed.</p>
          <div className="install-steps"><div><b>iPhone</b><span>Open in Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</span></div><div><b>Android</b><span>Open your browser menu, then choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span></div><div><b>Computer</b><span>Look for the install icon in the right side of your browser’s address bar.</span></div></div>
          <button className="button-lime modal-done" onClick={() => setInstallHelp(false)}>Got it <Check size={16} /></button>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  </main>
}
