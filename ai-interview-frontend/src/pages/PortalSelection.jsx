import React, { useEffect } from 'react';
import { ArrowRight, BrainCircuit } from 'lucide-react';
import { motion, useMotionValue, useSpring as useFramerSpring, useAnimate } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import '../styles/globals.css';

// ────────────────────────────────────────────────────────
// NEW: HeroWiFi Component (Floating Left side sequence)
// ────────────────────────────────────────────────────────
const HeroWiFi = () => {
  const containerVariants = {
    animate: {
      transition: { 
        staggerChildren: 0.8, // Slow drag between arcs
        repeat: Infinity, 
        repeatDelay: 2.0 
      }
    }
  };

  const arcVariants = {
    initial: { opacity: 0.15, filter: 'drop-shadow(0 0 0px #FF2D78)' },
    animate: { 
      opacity: [0.15, 1, 1, 0.15],
      filter: [
        'drop-shadow(0 0 0px #FF2D78)', 
        'drop-shadow(0 0 15px #FF2D78)', 
        'drop-shadow(0 0 15px #FF2D78)', 
        'drop-shadow(0 0 0px #FF2D78)'
      ],
      // Much slower lighting and holding effect
      transition: { duration: 4.0, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }
    }
  };

  return (
    <div 
      style={{ 
        position: 'absolute', left: '12%', top: '35%', 
        opacity: 0.5, zIndex: 10
      }}
    >
      <motion.svg 
        width="100" height="100" viewBox="0 0 24 24" 
        fill="none" stroke="#FF2D78" strokeWidth="2.5" 
        strokeLinecap="round" strokeLinejoin="round" 
        variants={containerVariants} 
        initial="initial" 
        animate="animate"
      >
        {/* Sequence from bottom to top for WiFi lighting effect */}
        {/* Dot */}
        <motion.path variants={arcVariants} d="M12 20h.01" />
        {/* Inner Arc */}
        <motion.path variants={arcVariants} d="M8.5 16.429a5 5 0 0 1 7 0" />
        {/* Middle Arc */}
        <motion.path variants={arcVariants} d="M5 12.859a10 10 0 0 1 14 0" />
        {/* Outer Arc */}
        <motion.path variants={arcVariants} d="M2 8.82a15 15 0 0 1 20 0" />
      </motion.svg>
    </div>
  );
};


// ────────────────────────────────────────────────────────
// NEW: HeroCheckmark Component (Floating Right side draw)
// ────────────────────────────────────────────────────────
const HeroCheckmark = () => {
  const [scope, animate] = useAnimate();

  // Float using React Spring
  const floatSpring = useSpring({
    from: { y: 15 },
    to: async (next) => {
      while (true) {
        await next({ y: -15 });
        await next({ y: 15 });
      }
    },
    config: { duration: 4200 },
    reset: true,
  });

  useEffect(() => {
    let active = true;

    const runAnimation = async () => {
      while (active) {
        // Reset states
        await Promise.all([
          animate("circle", { pathLength: 0, opacity: 0 }, { duration: 0 }),
          animate("path", { pathLength: 0, opacity: 0 }, { duration: 0 }),
          animate(scope.current, { filter: 'drop-shadow(0 0 0px #FF2D78)', opacity: 1 }, { duration: 0 })
        ]);

        // Draw Circle
        await animate("circle", { opacity: 0.15 }, { duration: 0.1 });
        await animate("circle", { opacity: 1, pathLength: 1 }, { duration: 1, ease: "easeInOut" });
        
        // Draw Checkmark
        await animate("path", { opacity: 1 }, { duration: 0.1 });
        await animate("path", { pathLength: 1 }, { duration: 0.6, ease: "easeOut" });

        // Pink Pulse once complete
        await animate(scope.current, { filter: 'drop-shadow(0 0 25px #FF2D78)' }, { duration: 0.3 });
        await animate(scope.current, { filter: 'drop-shadow(0 0 6px #FF2D78)' }, { duration: 0.5 });

        // Hold for 3 seconds of "Approval"
        await new Promise(r => setTimeout(r, 3000));
        if (!active) break;
        
        // Fade out to restart
        await animate(scope.current, { opacity: 0 }, { duration: 0.8 });
      }
    };

    runAnimation();
    return () => { active = false; };
  }, [animate, scope]);

  return (
    <animated.div 
      style={{ 
        position: 'fixed', bottom: '2rem', right: '2rem', 
        opacity: 0.5, zIndex: 10,
        transform: floatSpring.y.to(y => `translateY(${y}px)`) 
      }}
    >
      <svg 
        ref={scope} 
        width="90" height="90" viewBox="0 0 24 24" 
        fill="none" stroke="#FF2D78" strokeWidth="2" 
        strokeLinecap="round" strokeLinejoin="round" 
        style={{ filter: 'drop-shadow(0 0 6px #FF2D78)' }}
      >
        <motion.circle cx="12" cy="12" r="10" initial={{ pathLength: 0, opacity: 0 }} />
        <motion.path d="M8 12l3 3 5-6" initial={{ pathLength: 0, opacity: 0 }} />
      </svg>
    </animated.div>
  );
};


// ────────────────────────────────────────────────────────
// MAIN PARENT COMPONENT
// ────────────────────────────────────────────────────────
const PortalSelection = ({ onSelectRole }) => {
  // 1. FRAMER MOTION: Mouse Tracking (Magnetic effect)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Soft framer spring for the magnetic lag follow
  const springX = useFramerSpring(mouseX, { stiffness: 20, damping: 40 });
  const springY = useFramerSpring(mouseY, { stiffness: 20, damping: 40 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Gentle parallax follow: move up to 50px off-center
      const x = (e.clientX - window.innerWidth / 2) * 0.05;
      const y = (e.clientY - window.innerHeight / 2) * 0.05;
      mouseX.set(x);
      mouseY.set(y);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // 2. REACT SPRING: Continuous slow vertical float
  const floatingSpring = useSpring({
    from: { y: -20 },
    to: async (next) => {
      while (true) {
        await next({ y: 20 });
        await next({ y: -20 });
      }
    },
    config: { duration: 4500 }, // Slow physics-based loop
    reset: true,
  });

  // 3. FRAMER MOTION: Stagger Variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.2 }
    }
  };

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.19, 1, 0.22, 1] } 
    }
  };

  return (
    <div className="hero-wrapper" style={{ position: 'relative' }}>
      
      {/* =========================================
          BACKGROUND LAYER: SPHERE & PARTICLES
          ========================================= */}
      <div 
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 0, pointerEvents: 'none'
        }}
      >
        {/* REACT SPRING: Wrapper for floating Y axis */}
        <animated.div style={{ transform: floatingSpring.y.to(y => `translateY(${y}px)`) }}>
          
          {/* FRAMER MOTION: Magnetic X/Y Follow + Breathing Scale + Rotational Gradient */}
          <motion.div
            style={{
              x: springX,
              y: springY,
              width: '700px',
              height: '700px',
              borderRadius: '50%',
              /* Layered radial gradients: hot pink core fading to transparent */
              background: 'radial-gradient(circle at 35% 35%, #FF2D78 0%, #aa144c 40%, transparent 70%)',
              filter: 'blur(100px)',
              opacity: 0.25,
              position: 'relative',
            }}
            animate={{
              scale: [1, 1.08, 1], // Breathing gently
              rotate: [0, 360],    // Rotating the inner gradient light source
            }}
            transition={{ duration: 14, ease: "linear", repeat: Infinity }}
          >
            {/* FRAMER MOTION: Orbiting particle 1 (Large trace) */}
            <motion.div
              style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: '#fff', boxShadow: '0 0 25px 6px #FF2D78',
                position: 'absolute', top: '50%', left: '50%',
                margin: '-6px 0 0 -6px'
              }}
              animate={{
                x: [0, 400, 0, -400, 0],
                y: [-400, 0, 400, 0, -400],
              }}
              transition={{ duration: 20, ease: "linear", repeat: Infinity }}
            />
            {/* FRAMER MOTION: Orbiting particle 2 (Medium trace reversed) */}
            <motion.div
              style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#fff', boxShadow: '0 0 15px 4px #FF2D78',
                position: 'absolute', top: '50%', left: '50%',
                margin: '-4px 0 0 -4px'
              }}
              animate={{
                x: [0, -300, 0, 300, 0],
                y: [300, 0, -300, 0, 300],
              }}
              transition={{ duration: 14, ease: "linear", repeat: Infinity }}
            />
            {/* FRAMER MOTION: Orbiting particle 3 (Tight fast trace) */}
            <motion.div
              style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: '#fff', boxShadow: '0 0 10px 2px #FF2D78',
                position: 'absolute', top: '50%', left: '50%',
                margin: '-2.5px 0 0 -2.5px'
              }}
              animate={{
                x: [200, 0, -200, 0, 200],
                y: [0, 200, 0, -200, 0],
              }}
              transition={{ duration: 8, ease: "linear", repeat: Infinity }}
            />
          </motion.div>
        </animated.div>
      </div>

      {/* =========================================
          NEW FLOATING ANIMATED ICONS
          ========================================= */}
      <HeroWiFi />
      <HeroCheckmark />

      {/* =========================================
          FOREGROUND CONTENT: FRAMER MOTION
          ========================================= */}
      
      {/* Top Left Navigation Area */}
      <motion.div 
        className="nav-top-left" 
        style={{ zIndex: 10 }}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUpVariant} className="hero-logo-badge">
          <BrainCircuit size={18} className="hero-logo-icon" />
          <span>Next-Hire AI</span>
        </motion.div>
        
        <motion.button 
          variants={fadeUpVariant}
          className="hero-btn hero-btn--secondary"
          onClick={() => onSelectRole('interviewer')}
        >
          Company Portal
        </motion.button>
      </motion.div>

      {/* Center Hero Content */}
      <motion.div 
        className="hero-content" 
        style={{ zIndex: 10 }}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.h1 variants={fadeUpVariant} className="hero-h1" style={{ position: 'relative' }}>
          Hire the Future.
          <span className="hero-h1-accent">with AI</span>
        </motion.h1>

        <motion.p variants={fadeUpVariant} className="hero-subtext">
          Conduct deep technical and behavioral interviews instantly. 
          Deploy fully autonomous <span className="hero-subtext-highlight">AI avatars</span> that screen, test, 
          and rank top tier engineering candidates with zero bias.
        </motion.p>

        {/* Primary Action - Centered */}
        <motion.div variants={fadeUpVariant} className="hero-primary-action">
          <button 
            className="hero-btn hero-btn--primary"
            onClick={() => onSelectRole('candidate')}
          >
            Start Interview <ArrowRight size={20} />
          </button>
        </motion.div>
      </motion.div>

      {/* Bottom Footer Tags */}
      <motion.div 
        className="hero-footer" 
        style={{ zIndex: 10 }}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <div style={{ display: 'flex', gap: '2rem' }}>
          <motion.div variants={fadeUpVariant} className="hero-footer-item">
            <div className="hero-footer-dot" /> System Online
          </motion.div>
          <motion.div variants={fadeUpVariant} className="hero-footer-item">v2.0 Beta</motion.div>
          <motion.div variants={fadeUpVariant} className="hero-footer-item">Encrypted</motion.div>
        </div>
      </motion.div>

    </div>
  );
};

export default PortalSelection;
