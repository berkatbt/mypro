import React from 'react'

export function DiceFaces({ value }) {
  // Render dots/pips for value 1..6
  switch (value) {
    case 1:
      return (
        <div className="flex h-full w-full items-center justify-center">
          <div className="dice-pip dice-pip-red" />
        </div>
      )
    case 2:
      return (
        <div className="relative h-full w-full p-2.5">
          <div className="dice-pip absolute top-2.5 left-2.5" />
          <div className="dice-pip absolute right-2.5 bottom-2.5" />
        </div>
      )
    case 3:
      return (
        <div className="relative h-full w-full p-2.5">
          <div className="dice-pip absolute top-2 left-2" />
          <div className="dice-pip absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="dice-pip absolute right-2 bottom-2" />
        </div>
      )
    case 4:
      return (
        <div className="grid h-full w-full grid-cols-2 grid-rows-2 items-center justify-items-center p-2">
          <div className="dice-pip" />
          <div className="dice-pip" />
          <div className="dice-pip" />
          <div className="dice-pip" />
        </div>
      )
    case 5:
      return (
        <div className="relative h-full w-full p-2">
          <div className="dice-pip absolute top-2 left-2" />
          <div className="dice-pip absolute top-2 right-2" />
          <div className="dice-pip absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="dice-pip absolute bottom-2 left-2" />
          <div className="dice-pip absolute right-2 bottom-2" />
        </div>
      )
    case 6:
      return (
        <div className="grid h-full w-full grid-cols-2 grid-rows-3 items-center justify-items-center p-1.5">
          <div className="dice-pip" />
          <div className="dice-pip" />
          <div className="dice-pip" />
          <div className="dice-pip" />
          <div className="dice-pip" />
          <div className="dice-pip" />
        </div>
      )
    default:
      return (
        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
          🎲
        </div>
      )
  }
}

export default function Dice({
  value,
  isRolling = false,
  isWaiting = false,
  disabled = false,
  onRoll,
}) {
  return (
    <button
      type="button"
      onClick={onRoll}
      disabled={disabled || isRolling}
      aria-label="Lempar Dadu"
      className={`ludo-dice-box ${isRolling ? 'ludo-dice-rolling' : ''} ${
        isWaiting ? 'ludo-dice-waiting' : ''
      }`}
    >
      <div
        key={value ?? 'none'}
        className={`h-full w-full ${value != null && !isRolling ? 'ludo-dice-result' : ''}`}
      >
        <DiceFaces value={value} />
      </div>
    </button>
  )
}
