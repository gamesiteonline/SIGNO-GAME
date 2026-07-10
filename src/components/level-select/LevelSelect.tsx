import { LEVELS } from '../game/levels/LevelData';

interface LevelSelectProps {
  levels: typeof LEVELS;
  completedLevels: number[];
  secretsFound: Record<string, number>;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({
  levels,
  completedLevels = [],
  secretsFound = {},
  onSelectLevel,
  onBack
}) => {
  // Group levels by chapters (5 levels per chapter)
  const chapters = [
    { id: 1, name: 'Forest Realm', levels: LEVELS.slice(0, 5) },
    { id: 2, name: 'Cave Depths', levels: LEVELS.slice(5, 10) },
    { id: 3, name: 'Industrial Wastes', levels: LEVELS.slice(10, 15) },
    { id: 4, name: 'Graveyard Shifts', levels: LEVELS.slice(15, 20) }
  ];

  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50">
      <div className="w-full max-w-4xl px-6 py-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center">
          <h1 className="text-5xl font-black text-white tracking-[0.5em] mb-2">
            LEVEL SELECT
          </h1>
          <p className="text-white/40 tracking-[0.8em] text-sm">
            CHOOSE YOUR PATH THROUGH THE DARKNESS
          </p>
        </div>

        {/* Chapters */}
        <div className="w-full space-y-6">
          {chapters.map(chapter => (
            <div key={chapter.id} className="space-y-4">
              <h2 className="text-2xl font-semibold text-white tracking-[0.4em]">
                Chapter {chapter.id}: {chapter.name}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {chapter.levels.map(level => {
                  const isCompleted = completedLevels.includes(level.id);
                  const chapterSecrets = Object.keys(secretsFound || {}).filter(key => {
                    const secretNum = parseInt(key.split('-')[1]) || 0;
                    return secretNum >= level.id * 10 && secretNum < (level.id + 1) * 10;
                  });
                  const secretCount = chapterSecrets.reduce((sum, key) => sum + (secretsFound[key] || 0), 0);

                  return (
                    <button
                      key={level.id}
                      onClick={() => onLevelSelect(level.id)}
                      disabled={level.id > 1 && !completedLevels.includes(level.id - 1) && level.id !== 1}
                      className={`relative group flex flex-col items-center p-4 border
                        ${isCompleted
                          ? 'border-white/30 bg-white/5 hover:bg-white/10'
                          : level.id > 1 && !completedLevels.includes(level.id - 1)
                            ? 'border-white/10 bg-black/30 hover:border-white/20'
                            : 'border-white/20 bg-black/40 hover:bg-white/5'}`}
                    >
                      {/* Level Number Badge */}
                      <div className={`absolute top-2 left-2 w-8 h-8 flex items-center justify-center
                        ${isCompleted
                          ? 'bg-white/20 text-white'
                          : level.id > 1 && !completedLevels.includes(level.id - 1)
                            ? 'bg-white/10 text-white/50'
                            : 'bg-white/30 text-white'}`}
                      >
                        {level.id}
                      </div>

                      {/* Level Info */}
                      <div className="flex flex-col items-center text-center mt-4">
                        <h3 className="text-white/80 text-lg font-semibold truncate w-24">
                          {level.name}
                        </h3>
                        <p className="text-white/40 text-xs mt-1">
                          {level.subtitle}
                        </p>

                        {/* Completion Indicators */}
                        {isCompleted && (
                          <div className="flex space-x-2 mt-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full" title="Completed" />
                            {secretCount > 0 && (
                              <div className="flex-1 flex justify-end">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full"
                                   title={`Secrets found: ${secretCount}/3`} />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Lock Indicator */}
                        {!isCompleted && level.id > 1 && !completedLevels.includes(level.id - 1) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <div className="text-white/50 text-xs">LOCKED</div>
                          </div>
                        )}

                        {/* Available but not completed */}
                        {!isCompleted && (level.id === 1 || completedLevels.includes(level.id - 1)) && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="mt-8 w-full py-4 border border-white/20 text-white/60 hover:text-white hover:border-white/40 tracking-[0.3em] text-xs transition-all"
        >
          BACK TO TITLE
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 text-white/10 text-[10px] tracking-[0.4em]">
        ← → NAVIGATE • SPACE/ENTER SELECT • ESC BACK
      </div>
    </div>
  );
};