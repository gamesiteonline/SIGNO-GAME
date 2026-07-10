// SIGNO Main Game Component
// Developed by Fahad Mohamed
// Overhauled with Splash Screen, Intensive Settings, and 20 Stages

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { GameEngine } from './engine/GameEngine';
import type { GameState } from './engine/Types';
import { LEVELS } from './levels/LevelData';
import { AudioManager } from './audio/AudioManager';
import { saveGameData, loadGameData, loadSettings, clearSaveData, hasSaveData, createAutoSaver } from '@/lib/saveSystem';
import {
  Play, Pause, RotateCcw, ChevronRight,
  Skull, Sparkles, Home, Trophy, Settings, Zap,
  Eye, Monitor, Sliders, User
} from 'lucide-react';
import LevelSelect from '@/components/level-select/LevelSelect';

const SETTINGS_OPTIONS = [
  { label: 'VOLUMETRIC BLOOM', key: 'bloom', icon: <Sparkles size={14}/> },
  { label: 'FILM GRAIN', key: 'grain', icon: <Monitor size={14}/> },
  { label: 'MOTION BLUR', key: 'motionBlur', icon: <Zap size={14}/> },
  { label: 'VIGNETTE', key: 'vignette', icon: <Eye size={14}/> },
  { label: 'CHROMATIC ABERRATION', key: 'chromaticAberration', icon: <Monitor size={14}/> },
  { label: 'HI-QUALITY LIGHTING', key: 'highQualityLighting', icon: <Zap size={14}/> },
];

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const audioRef = useRef<AudioManager | null>(null);
  const saveSettingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveSettingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const [gameState, setGameState] = useState<GameState>({
    screen: 'splash',
    currentLevel: 0,
    deaths: 0,
    collectiblesFound: 0,
    totalCollectibles: 0,
    timeElapsed: 0,
    secretsFound: 0,
  });

  // Track completed levels and secrets
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [secretsFound, setSecretsFound] = useState<Record<string, number>>({});
   number>>({});

  // Load saved data on initial render
  useEffect(() => {
    const savedData = loadGameData();
    if (savedData) {
      // Apply saved data
      setCompletedLevels(savedData.completedLevels);
      setSecretsFound(savedData.secretsFound);

      // Merge saved game state with defaults to ensure all properties exist
      const mergedGameState = {
        screen: savedData.gameState.screen,
        currentLevel: savedData.gameState.currentLevel,
        deaths: savedData.gameState.deaths ?? 0,
        collectiblesFound: savedData.gameState.collectiblesFound ?? 0,
        totalCollectibles: savedData.gameState.totalCollectibles ?? 0,
        timeElapsed: savedData.gameState.timeElapsed ?? 0,
        secretsFound: savedData.gameState.secretsFound ?? 0,
      };

      setGameState(mergedGameState);

      // Apply saved settings
      const savedSettings = loadSettings();
      if (Object.keys(savedSettings).length > 0) {
        setSettings(prev => ({ ...prev, ...savedSettings }));
      }

      console.log('Loaded saved game data');
    }
  }, []);

  // Set up auto-saver
  useEffect(() => {
    const stateGetter = () => ({
      completedLevels,
      secretsFound,
      gameState,
      settings
    });

    const autoSaver = createAutoSaver(stateGetter, 30000); // Save every 30 seconds
    autoSaver.start();

    return () => {
      autoSaver.stop();
    };
  }, []);


  const [showSettings, setShowSettings] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [_levelStartAnim, setLevelStartAnim] = useState(false);
  const [currentLevelName, setCurrentLevelName] = useState('');
  const [screen, setScreen] = useState<'splash' | 'title' | 'playing' | 'paused' | 'dead' | 'level-complete' | 'credits' | 'level-select'>('splash');

  // Debounced settings saving
  const handleSettingChange = (key: keyof typeof settings) => {
    // Update state immediately
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));

    // Clear existing timeout
    if (saveSettingsTimeoutRef.current) {
      clearTimeout(saveSettingsTimeoutRef.current);
    }

    // Set new timeout to save after 500ms
    saveSettingsTimeoutRef.current = setTimeout(() => {
      // Save settings
      const saveData = loadGameData();
      if (saveData) {
        saveGameData(
          saveData.completedLevels,
          saveData.secretsFound,
          saveData.gameState,
          settings
        );
      } else {
        saveGameData([], {}, {
          screen: 'title',
          currentLevel: 0,
          deaths: 0,
          collectiblesFound: 0,
          totalCollectibles: 0,
          timeElapsed: 0,
          secretsFound: 0
        }, settings);
      }
      saveSettingsTimeoutRef.current = null;
    }, 500);
  };

  // Save any pending settings changes when unhooking or closing settings modal
  useEffect(() => {
    return () => {
      // Clean up timeout on unmount
      if (saveSettingsTimeoutRef.current) {
        clearTimeout(saveSettingsTimeoutRef.current);
        saveSettingsTimeoutRef.current = null;
      }
    };
  }, []);
  
  // Intensive Settings State
  const [settings, setSettings] = useState({
    bloom: true,
    grain: true,
    motionBlur: true,
    vignette: true,
    chromaticAberration: true,
    highQualityLighting: true,
    screenshake: 1.0,
    gamma: 1.0
  });

  // Splash Screen Logic
  useEffect(() => {
    if (screen === 'splash') {
      const timer = setTimeout(() => {
        setScreen('title');
        setGameState(prev => ({ ...prev, screen: 'title' }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Initialize engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;
    audioRef.current = new AudioManager();

    engine.onStateChange = (state: GameState) => {
      setGameState({ ...state });
      setScreen(state.screen);
      if (state.screen === 'playing') {
        const level = LEVELS.find(l => l.id === state.currentLevel);
        if (level) {
          audioRef.current?.startAmbient(level.theme);
          setCurrentLevelName(level.name);
          setLevelStartAnim(true);
          setTimeout(() => setLevelStartAnim(false), 3000);
        }
      }

      // Save game state when screen changes (important transitions)
      if (state.screen !== gameState.screen) {
        // Save on important screen transitions
        const importantScreens = ['playing', 'paused', 'dead', 'level-complete', 'level-select'];
        if (importantScreens.includes(state.screen) || importantScreens.includes(gameState.screen)) {
          saveGameData(
            completedLevels,
            secretsFound,
            {
              ...state,
              // Don't save timeElapsed during pause as it shouldn't accumulate
              timeElapsed: state.screen === 'paused' ? gameState.timeElapsed : state.timeElapsed
            },
            settings
          );
        }
      }
    };

    engine.onDeath = () => {
      audioRef.current?.playDeath();
      // Trigger death particle effect
      const engine = engineRef.current;
      if (engine && engine.player) {
        engine.particles.emitDeathEffect(engine.player.pos.x, engine.player.pos.y);
      }

      // Add screen shake for death
      if (engine) {
        engine.camera.shakeIntensity = 15; // Strong shake for death
      }

      // Save game progress when player dies (increment deaths)
      saveGameData(
        completedLevels,
        secretsFound,
        {
          ...gameState,
          deaths: gameState.deaths + 1,
          screen: 'dead'
        },
        settings
      );
    };
    engine.onCollectible = (type: string) => {
      audioRef.current?.playCollect();
      // Track secrets found
      if (type === 'signo-rune') {
        setSecretsFound(prev => ({
          ...prev,
          [gameState.currentLevel]: (prev[gameState.currentLevel] || 0) + 1
        }));
      }
      // Collectible particle effect
      const engine = engineRef.current;
      if (engine) {
        // Get collectible position - we'll need to pass this from the engine
        // For now, we'll use a generic position near player
        if (engine.player) {
          engine.particles.emitBurst(
            engine.player.pos.x,
            engine.player.pos.y - 20,
            8,
            'spark',
            '#00ff00',
            { speed: 80, gravity: false }
          );
        }
      }

      // Save game progress when collecting items
      saveGameData(
        completedLevels,
        {
          ...secretsFound,
          [gameState.currentLevel]: (secretsFound[gameState.currentLevel] || 0) + (type === 'signo-rune' ? 1 : 0)
        },
        {
          ...gameState,
          collectiblesFound: gameState.collectiblesFound + 1
        },
        settings
      );
    };
    
    // Periodically update audio for random stingers
    const audioInterval = setInterval(() => {
      audioRef.current?.update();
    }, 1000);
    
    // Connect player audio & Screen Shake
    if (engine.player) {
      engine.player.onJump = () => {
        audioRef.current?.playJump();
        engine.camera.shakeIntensity = 2; // Subtle jump shake
        // Add jump effect particles
        engine.particles.emitJumpEffect(engine.player.pos.x, engine.player.pos.y);
      };
      engine.player.onLand = () => {
        audioRef.current?.playLand();
        engine.camera.shakeIntensity = 8; // Heavy landing shake
        // Add landing effect particles
        engine.particles.emitLandingEffect(engine.player.pos.x, engine.player.pos.y);
      };
    }

    engine.start();
    engine.loadImage('/assets/title-art.jpg');
    engine.loadImage('/assets/player-idle.png');

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      engine.stop();
      clearInterval(audioInterval);
      audioRef.current?.destroy();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const startGame = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;

    // Start from the first level if no progress, otherwise continue from last completed
    const startLevel = completedLevels.length > 0
      ? Math.max(...completedLevels) + 1
      : 0;

    // If we've completed all levels, start from the beginning
    if (startLevel >= LEVELS.length) {
      setCompletedLevels([]);
      setSecretsFound({});
    }

    const levelIndex = Math.min(startLevel, LEVELS.length - 1);
    const levelData = LEVELS[levelIndex];

    await engine.loadLevel(levelData);
    // The engine will update the state through onStateChange
    engine.setScreen('playing');
    audioRef.current?.startAmbient(levelData.theme);

    // Save game progress when starting a new game/level
    saveGameData(
      completedLevels,
      secretsFound,
      {
        ...gameState,
        currentLevel: levelData.id,
        screen: 'playing',
        deaths: 0,
        collectiblesFound: 0,
        timeElapsed: 0
      },
      settings
    );
  }, [completedLevels, secretsFound, gameState, settings]);



  const nextLevel = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;

    const nextId = gameState.currentLevel + 1;
    const levelData = LEVELS.find(l => l.id === nextId);
    if (!levelData) {
      setScreen('credits');
      return;
    }
    // Mark current level as completed
    setCompletedLevels(prev => [...new Set([...prev, gameState.currentLevel])]);
    await engine.loadLevel(levelData);
    setScreen('playing');

    // Celebration particle effect
    if (engine && engine.player) {
      // Explosion effect at player position
      engine.particles.emitBurst(
        engine.player.pos.x,
        engine.player.pos.y - 20, // Slightly above player
        20, // Number of particles
        'spark',
        '#ffff00', // Yellow color for celebration
        { speed: 150, gravity: false, decay: 0.95 }
      );

      // Additional confetti-like effect
      engine.particles.emitBurst(
        engine.player.pos.x,
        engine.player.pos.y - 30,
        15,
        'spark',
        '#ff00ff', // Pink/purple
        { speed: 100, gravity: true, decay: 0.9 }
      );
    }

    audioRef.current?.playLevelComplete();

    // Save game progress after completing a level
    saveGameData(
      [...new Set([...completedLevels, gameState.currentLevel])],
      secretsFound,
      {
        ...gameState,
        currentLevel: nextId,
        screen: 'playing',
        timeElapsed: 0  // Reset timer for new level
      },
      settings
    );
  }, [gameState.currentLevel, completedLevels, secretsFound, gameState, settings]);

  const restartLevel = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    const levelData = LEVELS.find(l => l.id === gameState.currentLevel);
    if (levelData) await engine.loadLevel(levelData);
    setScreen('playing');
    // Reset collectibles for this attempt but keep progress
    setGameState(prev => ({
      ...prev,
      collectiblesFound: 0,
      timeElapsed: 0
    }));

    // Save game progress when restarting level (resets time and collectibles for attempt)
    saveGameData(
      completedLevels,
      secretsFound,
      {
        ...gameState,
        collectiblesFound: 0,
        timeElapsed: 0,
        screen: 'playing'
      },
      settings
    );
  }, [gameState.currentLevel, completedLevels, secretsFound, gameState, settings]);

  // Debounced settings saving
  const handleSettingChange = useCallback((key: keyof typeof settings) => {
    // Update state immediately
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));

    // Clear existing timeout
    if (saveSettingsTimeoutRef.current) {
      clearTimeout(saveSettingsTimeoutRef.current);
    }

    // Set new timeout to save after 500ms
    saveSettingsTimeoutRef.current = setTimeout(() => {
      // Save settings
      const saveData = loadGameData();
      if (saveData) {
        saveGameData(
          saveData.completedLevels,
          saveData.secretsFound,
          saveData.gameState,
          settings
        );
      } else {
        saveGameData([], {}, {
          screen: 'title',
          currentLevel: 0,
          deaths: 0,
          collectiblesFound: 0,
          totalCollectibles: 0,
          timeElapsed: 0,
          secretsFound: 0
        }, settings);
      }
      saveSettingsTimeoutRef.current = null;
    }, 500);
  }, [settings]);

  // Splash Screen Component
  const SplashScreen = () => {
    const company = "GAME SITE ONLINE company";
    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50">
        <div className="flex gap-1 mb-4">
          {company.split("").map((char, i) => (
            <span 
              key={i} 
              className="text-4xl font-bold text-white letter-burn animate-fire"
              style={{ animationDelay: `${i * 0.1}s`, whiteSpace: char === " " ? "pre" : "normal" }}
            >
              {char}
            </span>
          ))}
        </div>
        <div className="text-white/20 tracking-[0.5em] text-xs animate-fade-in mt-8" style={{ animationDelay: '3s' }}>
          PRESENTS
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none font-sans">
      {/* Orientation Warning */}
      <div className="orientation-warning">
        <RotateCcw className="rotate-icon text-white" />
        <h2 className="text-2xl font-light tracking-widest mb-2 uppercase">Please Rotate Your Device</h2>
        <p className="text-white/40 text-sm tracking-wider">SIGNO is best experienced in Landscape mode</p>
      </div>

      {screen === 'splash' && <SplashScreen />}
      
      <div className="grain-overlay" />
      <div className="fog-layer" />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Title Screen */}
      {screen === 'title' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40">
          <div className="mb-12 text-center animate-slide-up">
            <h1 className="text-8xl font-black text-white tracking-[0.5em] mb-2 opacity-80 animate-flicker">SIGNO</h1>
            <p className="text-white/40 tracking-[0.8em] text-sm">A LIMBO TRIBUTE</p>
          </div>
          
          <div className="flex flex-col gap-4 w-64 animate-fade-in" style={{ animationDelay: '1s' }}>
            <button onClick={startGame} className="group relative overflow-hidden border border-white/20 py-4 text-white tracking-[0.3em] hover:bg-white hover:text-black transition-all">
              <span className="relative z-10 flex items-center justify-center gap-2"><Play size={18}/> START</span>
            </button>
            <div className="flex gap-4">
              <button onClick={() => setShowSettings(true)} className="flex-1 border border-white/10 py-3 text-white/40 hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-2">
                <Settings size={14}/> SETTINGS
              </button>
              <button onClick={() => setShowCredits(true)} className="flex-1 border border-white/10 py-3 text-white/40 hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-2">
                <User size={14}/> CREDITS
              </button>
            </div>
          </div>

          <div className="absolute bottom-8 text-white/10 text-[10px] tracking-[0.4em]">
            DEVELOPED BY FAHAD MALIBICHE • FAHAD GAME SITE ONLINE
          </div>
        </div>
      )}

      {/* Intensive Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl border border-white/10 bg-black p-8">
            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
              <Sliders className="text-white/60" />
              <h2 className="text-white text-2xl tracking-[0.4em]">INTENSIVE SETTINGS</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-12">
              {[
                { label: 'VOLUMETRIC BLOOM', key: 'bloom', icon: <Sparkles size={14}/> },
                { label: 'FILM GRAIN', key: 'grain', icon: <Monitor size={14}/> },
                { label: 'MOTION BLUR', key: 'motionBlur', icon: <Zap size={14}/> },
                { label: 'VIGNETTE', key: 'vignette', icon: <Eye size={14}/> },
                { label: 'CHROMATIC ABERRATION', key: 'chromaticAberration', icon: <Monitor size={14}/> },
                { label: 'HI-QUALITY LIGHTING', key: 'highQualityLighting', icon: <Zap size={14}/> },
              ].map(s => (
                <div key={s.key} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 text-white/40 group-hover:text-white/80 transition-all">
                    {s.icon}
                    <span className="text-xs tracking-widest">{s.label}</span>
                  </div>
                  <button
                    onClick={() => handleSettingChange(s.key as keyof typeof settings)}
                    className={`w-12 h-6 border transition-all ${settings[s.key as keyof typeof settings] ? 'bg-white border-white' : 'border-white/20'}`}
                  >
                    <div className={`w-4 h-4 m-1 transition-all ${settings[s.key as keyof typeof settings] ? 'bg-black ml-7' : 'bg-white/20'}`} />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={() => {
              // Flush any pending settings changes
              if (saveSettingsTimeoutRef.current) {
                clearTimeout(saveSettingsTimeoutRef.current);
                // Save settings immediately
                const saveData = loadGameData();
                if (saveData) {
                  saveGameData(
                    saveData.completedLevels,
                    saveData.secretsFound,
                    saveData.gameState,
                    settings
                  );
                } else {
                  saveGameData([], {}, {
                    screen: 'title',
                    currentLevel: 0,
                    deaths: 0,
                    collectiblesFound: 0,
                    totalCollectibles: 0,
                    timeElapsed: 0,
                    secretsFound: 0
                  }, settings);
                }
                saveSettingsTimeoutRef.current = null;
              }
              setShowSettings(false);
            }} className="w-full py-4 border border-white/20 text-white/60 hover:text-white hover:border-white/40 tracking-[0.3em] text-xs transition-all">
              APPLY & CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Credits Modal - LIMBO Minimalist Style */}
      {showCredits && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowCredits(false)}>
          <div className="w-full max-w-4xl text-center py-20" onClick={e => e.stopPropagation()}>
            
            <div className="space-y-24 mb-32">
              {/* Game Title */}
              <section className="animate-fade-in">
                <h1 className="text-7xl font-black text-white/90 tracking-[0.6em] mb-4">SIGNO</h1>
                <div className="w-24 h-px bg-white/10 mx-auto" />
              </section>

              {/* Developer Spotlight */}
              <section className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="w-32 h-32 mx-auto rounded-full border border-white/5 overflow-hidden mb-8 grayscale contrast-150 brightness-75">
                  <img src="/assets/developer.png" alt="Fahad Malibiche" className="w-full h-full object-cover" />
                </div>
                <p className="text-white/20 text-[10px] tracking-[0.8em] mb-3 uppercase">Lead Developer</p>
                <h2 className="text-white/80 text-2xl tracking-[0.4em] uppercase font-light">Fahad Malibiche</h2>
                <p className="text-white/30 text-xs tracking-widest max-w-md mx-auto">
                  Lead programmer, designer, and artist behind SIGNO's atmospheric world.
                </p>
              </section>

              {/* About the Game */}
              <section className="animate-fade-in" style={{ animationDelay: '0.75s' }}>
                <p className="text-white/20 text-[10px] tracking-[0.8em] mb-4 uppercase">About SIGNO</p>
                <p className="text-white/40 text-sm tracking-widest max-w-2xl mx-auto">
                  SIGNO is a challenging 2D platformer inspired by LIMBO, featuring atmospheric visuals, immersive audio, and precise controls. Navigate through hazardous environments, solve physics-based puzzles, and uncover hidden secrets as you journey into the darkness.
                </p>
              </section>

              {/* Core Credits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-16 animate-fade-in" style={{ animationDelay: '1s' }}>
                <section>
                  <p className="text-white/20 text-[10px] tracking-[0.8em] mb-4 uppercase">Production</p>
                  <p className="text-white/60 text-sm tracking-widest uppercase">Fahad Game Site Online</p>
                </section>
                <section>
                  <p className="text-white/20 text-[10px] tracking-[0.8em] mb-4 uppercase">Art & Design</p>
                  <p className="text-white/60 text-sm tracking-widest uppercase">Monochromatic Obsidian</p>
                </section>
                <section>
                  <p className="text-white/20 text-[10px] tracking-[0.8em] mb-4 uppercase">Publishing</p>
                  <p className="text-white/60 text-sm tracking-widest uppercase">Game Site Online</p>
                </section>
              </div>

              {/* Socials */}
              <section className="animate-fade-in" style={{ animationDelay: '1.5s' }}>
                <p className="text-white/20 text-[10px] tracking-[0.8em] mb-6 uppercase">Connect</p>
                <div className="flex justify-center gap-6 flex-wrap">
                  <a href="https://www.instagram.com/ard.sing?igsh=NnQ3ZWVmYXh4b2Zn" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/90 transition-all text-xs tracking-[0.3em] uppercase border-b border-transparent hover:border-white/20 pb-1">
                    Instagram
                  </a>
                  <span className="mx-2 text-white/20">•</span>
                  <a href="https://youtube.com/@gamesiteonline" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/90 transition-all text-xs tracking-[0.3em] uppercase border-b border-transparent hover:border-white/20 pb-1">
                    YouTube
                  </a>
                  <span className="mx-2 text-white/20">•</span>
                  <a href="https://whatsapp.com/channel/0029VbChyDUI1rcht5jajL3q" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/90 transition-all text-xs tracking-[0.3em] uppercase border-b border-transparent hover:border-white/20 pb-1">
                    WhatsApp
                  </a>
                  <span className="mx-2 text-white/20">•</span>
                  <a href="https://www.threads.com/@ard.sing" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/90 transition-all text-xs tracking-[0.3em] uppercase border-b border-transparent hover:border-white/20 pb-1">
                    Threads
                  </a>
                  <span className="mx-2 text-white/20">•</span>
                  <a href="https://wa.me/qr/FYVTX2AFYSUVH1" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/90 transition-all text-xs tracking-[0.3em] uppercase border-b border-transparent hover:border-white/20 pb-1">
                    WhatsApp QR
                  </a>
                </div>
              </section>
            </div>

            <button onClick={() => setShowCredits(false)} className="group text-white/20 hover:text-white/80 tracking-[0.6em] text-[10px] transition-all uppercase flex items-center gap-4 mx-auto">
              <div className="w-8 h-px bg-white/10 group-hover:w-12 transition-all" />
              Return
              <div className="w-8 h-px bg-white/10 group-hover:w-12 transition-all" />
            </button>
          </div>
        </div>
      )}

      {/* Playing UI - Professional HUD */}
      {screen === 'playing' && (
        <div className="absolute top-0 left-0 right-0 p-10 flex justify-between items-start z-10 pointer-events-none">
          <div className="flex flex-col gap-2 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-8 h-px bg-white/10" />
              <p className="text-white/20 text-[8px] tracking-[0.6em] uppercase font-light">OBSERVATION {gameState.currentLevel + 1}</p>
            </div>
            <h2 className="text-white/60 text-xl tracking-[0.3em] uppercase font-extralight ml-12">{currentLevelName}</h2>
          </div>
          
          <div className="flex gap-10 items-center pointer-events-auto animate-fade-in">
            <div className="flex flex-col items-end gap-1">
              <p className="text-white/10 text-[7px] tracking-[0.4em] uppercase">CASUALTIES</p>
              <div className="flex items-center gap-2 text-white/30">
                <Skull size={10} className="opacity-40" />
                <span className="text-base font-light tracking-tighter">{gameState.deaths.toString().padStart(2, '0')}</span>
              </div>
            </div>
            <button 
              onClick={() => setScreen('paused')} 
              className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-white/20 hover:text-white hover:border-white/20 transition-all group"
            >
              <Pause size={16} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Pause Menu */}
      {screen === 'paused' && (
        <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center">
          <div className="w-64 flex flex-col gap-4">
            <h2 className="text-white text-center text-3xl tracking-[0.5em] mb-8">PAUSED</h2>
            <button onClick={() => setScreen('playing')} className="py-4 border border-white/20 text-white tracking-[0.3em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2">
              <Play size={16}/> RESUME
            </button>
            <button onClick={restartLevel} className="py-4 border border-white/10 text-white/40 tracking-[0.2em] hover:text-white transition-all flex items-center justify-center gap-2">
              <RotateCcw size={16}/> RESTART
            </button>
            <button onClick={() => setScreen('title')} className="py-4 border border-white/10 text-white/40 tracking-[0.2em] hover:text-white transition-all flex items-center justify-center gap-2">
              <Home size={16}/> QUIT
            </button>
          </div>
        </div>
      )}

      {/* Death Screen */}
      {screen === 'dead' && (
        <div className="absolute inset-0 z-40 bg-black/90 flex items-center justify-center">
          <div className="text-center animate-fade-in space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 border-2 border-red-500 rounded-full flex items-center justify-center">
                <Skull size={16} className="text-red-400" />
              </div>
              <h2 className="text-red-500 text-3xl font-bold tracking-[0.05em]">YOU DIED</h2>
            </div>
            <p className="text-white/50 text-lg">
              YOU DIED {gameState.deaths} TIME{{ gameState.deaths !== 1 ? 'S' : '' }}
            </p>
            <div className="flex space-x-4">
              <button onClick={restartLevel} className="px-6 py-3 border border-red-500 text-red-400 hover:bg-red-500 hover:text-black transition-all">
                TRY AGAIN
              </button>
              <button onClick={() => setScreen('level-select')} className="px-6 py-3 border border-red-500 text-red-400 hover:bg-red-500 hover:text-black transition-all">
                LEVEL SELECT
              </button>
              <button onClick={() => setScreen('title')} className="px-6 py-3 border border-red-500 text-red-400 hover:bg-red-500 hover:text-black transition-all">
                QUIT GAME
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Complete */}
      {screen === 'level-complete' && (
        <div className="absolute inset-0 z-40 bg-black flex items-center justify-center">
          justify-center">
          <div className="text-center animate-fade-in">
            <Trophy className="mx-auto mb-8 text-white/20" size={48} />
            <h2 className="text-white text-4xl tracking-[0.4em] mb-2">STAGE CLEAR</h2>
            <p className="text-white/30 tracking-[0.2em] mb-12">THE DARKNESS DEEPENS</p>
            <button onClick={nextLevel} className="px-12 py-4 border border-white/30 text-white tracking-[0.3em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 mx-auto">
              CONTINUE <ChevronRight size={18}/>
            </button>
          </div>
        </div>
      )}

      {/* Level Selection Screen */}
      {screen === 'level-select' && (
        <LevelSelect
          levels={LEVELS}
          completedLevels={completedLevels}
          secretsFound={secretsFound}
          onSelectLevel={(levelId) => {
            const levelData = LEVELS.find(l => l.id === levelId);
            if (levelData) {
              // Load the level
              const engine = engineRef.current;
              if (engine) {
                engine.loadLevel(levelData).then(() => {
                  // The engine will update the state through onStateChange
                  engine.setScreen('playing');
                });
              }
            }

            // Save game progress when selecting a level from menu
            saveGameData(
              completedLevels,
              secretsFound,
              {
                ...gameState,
                currentLevel: levelId,
                screen: 'playing',
                deaths: 0,  // Reset deaths for new attempt
                collectiblesFound: 0,
                timeElapsed: 0
              },
              settings
            );
          }}
          onBack={() => {
            setScreen('title');
            setGameState(prev => ({ ...prev, screen: 'title' }));
          }}
        />
      )}
    </div>
  );
};

export default Game;
