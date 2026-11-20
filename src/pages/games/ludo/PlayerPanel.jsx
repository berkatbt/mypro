import React from 'react'
import { Bot, Crown, User } from 'lucide-react'
import { COLOR_CONFIG, GAME_PHASES } from './constants'
import Dice from './Dice'

export default function PlayerPanel({
  player,
  isActive = false,
  phase,
  currentDice,
  isRolling = false,
  timerSeconds = null,
  onRoll,
}) {
  const config = COLOR_CONFIG[player.color]
  const isHuman = !player.isBot
  const canRoll = isActive && isHuman && phase === GAME_PHASES.WAIT_ROLL && !isRolling

  return (
    <div
      style={{
        '--glow-color': config.hex,
      }}
      className={`relative flex items-center justify-between gap-2.5 rounded-2xl border px-3 py-2 transition-all duration-300 ${
        isActive
          ? 'turn-ring-active border-white/80 bg-slate-900/90 shadow-lg'
          : 'border-white/10 bg-slate-950/60 opacity-80'
      }`}
    >
      {/* Player Avatar & Info */}
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-white shadow-md"
          style={{ backgroundColor: config.hex }}
        >
          {player.isBot ? <Bot size={18} /> : <User size={18} />}
          <span
            className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white border border-white/30"
          >
            {config.symbol}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-bold text-white">
              {player.name}
            </span>
            {player.hasWon && (
              <span className="shrink-0 text-amber-400">
                <Crown size={13} />
              </span>
            )}
          </div>

          {/* Tokens Home Indicator (4 dots) */}
          <div className="mt-1 flex items-center gap-1">
            {[0, 1, 2, 3].map((idx) => {
              const isHome = idx < player.tokensAtHome
              return (
                <span
                  key={idx}
                  className={`h-2 w-2 rounded-full border transition-all ${
                    isHome
                      ? 'border-amber-400 bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                      : 'border-white/20 bg-white/5'
                  }`}
                />
              )
            })}
            <span className="ml-1 text-[10px] font-semibold text-slate-400 tabular-nums">
              {player.tokensAtHome}/4
            </span>
          </div>
        </div>
      </div>

      {/* Dice display on the active player panel */}
      {isActive ? (
        <div className="flex items-center gap-2">
          {timerSeconds !== null && timerSeconds > 0 && (
            <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold text-amber-300 tabular-nums border border-amber-400/30">
              {timerSeconds}s
            </span>
          )}
          <Dice
            value={currentDice}
            isRolling={isRolling}
            isWaiting={canRoll}
            disabled={!canRoll}
            onRoll={onRoll}
          />
        </div>
      ) : (
        <div className="h-10 w-10 opacity-30 flex items-center justify-center text-slate-500 text-xs">
          {config.name}
        </div>
      )}
    </div>
  )
}
