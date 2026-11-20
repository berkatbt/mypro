import React, { useMemo } from 'react'
import {
  BASE_POS,
  BASE_SLOTS,
  COLOR_CONFIG,
  COMMON_TRACK,
  GAME_PHASES,
  HOME_COLUMNS,
  HOME_POS,
  SAFE_TRACK_INDICES,
  STAR_TRACK_INDICES,
} from './constants'
import { getCommonTrackIndex, getTokenCoordinate } from './engine'

const CELL_SIZE = 50

// Star SVG path centered around (0,0)
const STAR_PATH =
  'M 0,-11 L 3.2,-3.5 L 11,-2.5 L 5.5,3 L 7,11 L 0,6.8 L -7,11 L -5.5,3 L -11,-2.5 L -3.2,-3.5 Z'

// Calculate pixel coordinates (x, y) for any (r, c)
function getCellPixelCenter(r, c) {
  return {
    x: c * CELL_SIZE + CELL_SIZE / 2,
    y: r * CELL_SIZE + CELL_SIZE / 2,
  }
}

// Arrow markers for Start cells
function StartArrow({ direction, color }) {
  // direction: 'right' (Red), 'down' (Green), 'left' (Yellow), 'up' (Blue)
  const angle =
    direction === 'right' ? 0 : direction === 'down' ? 90 : direction === 'left' ? 180 : 270

  return (
    <g transform={`rotate(${angle})`}>
      <path
        d="M -7,-5 L 4,0 L -7,5 Z"
        fill="#ffffff"
        opacity="0.9"
      />
    </g>
  )
}

// Glossy Pawn Component
export function LudoPawn({
  token,
  player,
  x,
  y,
  scale = 1,
  isSelectable = false,
  isHopping = false,
  onClick,
}) {
  const config = COLOR_CONFIG[player.color]

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${scale})`}
      className={`ludo-token-group ${isSelectable ? 'selectable' : ''} ${
        isHopping ? 'ludo-token-hopping' : ''
      }`}
      onClick={(e) => {
        if (isSelectable && onClick) {
          e.stopPropagation()
          onClick(token.id)
        }
      }}
      role={isSelectable ? 'button' : undefined}
      aria-label={`${player.name} pion ${token.id + 1} (${config.name})`}
      tabIndex={isSelectable ? 0 : -1}
      onKeyDown={(e) => {
        if (isSelectable && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick(token.id)
        }
      }}
    >
      {/* Active Selection Glow Ring */}
      {isSelectable && (
        <circle
          cx="0"
          cy="0"
          r="23"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeDasharray="5 3"
        />
      )}

      {/* Shadow */}
      <ellipse
        cx="0"
        cy="13"
        rx="13"
        ry="4.5"
        fill="#0f172a"
        opacity="0.4"
      />

      {/* Pawn Base */}
      <ellipse
        cx="0"
        cy="10"
        rx="12"
        ry="4"
        fill={`url(#pawnBaseGrad-${player.color})`}
      />

      {/* Pawn Body / Neck */}
      <path
        d="M -10,9 C -8,1 -5,-4 -3,-7 L 3,-7 C 5,-4 8,1 10,9 Z"
        fill={`url(#pawnBodyGrad-${player.color})`}
      />

      {/* Collar Ring */}
      <ellipse
        cx="0"
        cy="-7"
        rx="6.5"
        ry="2"
        fill="#ffffff"
        opacity="0.85"
      />

      {/* Head Sphere */}
      <circle
        cx="0"
        cy="-13"
        r="8.5"
        fill={`url(#pawnHeadGrad-${player.color})`}
      />

      {/* Color-blind Accessible Symbol on Head */}
      <text
        x="0"
        y="-11"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="bold"
        fill="#ffffff"
        style={{ pointerEvents: 'none' }}
      >
        {config.symbol}
      </text>

      {/* 3D Highlight Gloss */}
      <ellipse
        cx="-2.5"
        cy="-15.5"
        rx="2.6"
        ry="1.4"
        fill="#ffffff"
        opacity="0.75"
        style={{ pointerEvents: 'none' }}
      />
    </g>
  )
}

export default function LudoBoard({
  state,
  animatingToken = null, // { playerId, tokenId, currentPos, hopIndex }
  onSelectToken,
}) {
  const { players, activePlayerIndex, phase, legalMoves } = state
  const activePlayer = players[activePlayerIndex]
  const isHumanTurn = activePlayer && !activePlayer.isBot
  const canSelect =
    isHumanTurn && (phase === GAME_PHASES.WAIT_SELECT || phase === GAME_PHASES.AUTO_MOVE)

  // Calculate coordinates & cluster offsets for all tokens on the board
  const tokenVisuals = useMemo(() => {
    const list = []
    const cellGroups = new Map()

    for (const player of players) {
      for (const token of player.tokens) {
        // If this token is currently in the middle of a hop animation, use its animating position
        const isThisTokenAnimating =
          animatingToken &&
          animatingToken.playerId === player.id &&
          animatingToken.tokenId === token.id

        const displayPos = isThisTokenAnimating ? animatingToken.currentPos : token.pos

        let coord
        let cellKey

        if (displayPos === BASE_POS) {
          coord = BASE_SLOTS[player.color][token.id]
          // Base slot centers: x = c * 50, y = r * 50
          const x = coord.c * CELL_SIZE
          const y = coord.r * CELL_SIZE
          cellKey = `base-${player.color}-${token.id}`
          list.push({
            token,
            player,
            x,
            y,
            cellKey,
            isBase: true,
            isHome: false,
          })
          continue
        } else if (displayPos === HOME_POS) {
          // Reached Home (7,7) - position in home triangles
          let hx = 375
          let hy = 375
          if (player.color === 'red') {
            hx = 340
            hy = 360 + token.id * 8
          } else if (player.color === 'green') {
            hx = 360 + token.id * 8
            hy = 340
          } else if (player.color === 'yellow') {
            hx = 410
            hy = 360 + token.id * 8
          } else if (player.color === 'blue') {
            hx = 360 + token.id * 8
            hy = 410
          }
          list.push({
            token,
            player,
            x: hx,
            y: hy,
            scale: 0.72,
            cellKey: `home-${player.color}-${token.id}`,
            isBase: false,
            isHome: true,
          })
          continue
        } else if (displayPos >= 51 && displayPos <= 55) {
          // Home column
          coord = HOME_COLUMNS[player.color][displayPos - 51]
          cellKey = `col-${player.color}-${displayPos}`
        } else {
          // Common track
          const trackIdx = (COLOR_CONFIG[player.color].startTrackIdx + displayPos) % 52
          coord = COMMON_TRACK[trackIdx]
          cellKey = `track-${trackIdx}`
        }

        const center = getCellPixelCenter(coord.r, coord.c)
        const entry = {
          token,
          player,
          baseX: center.x,
          baseY: center.y,
          cellKey,
          isBase: false,
          isHome: false,
        }

        if (!cellGroups.has(cellKey)) {
          cellGroups.set(cellKey, [])
        }
        cellGroups.get(cellKey).push(entry)
        list.push(entry)
      }
    }

    // Apply multi-token offsets so tokens in the same cell don't overlap
    for (const [key, group] of cellGroups.entries()) {
      const count = group.length
      if (count === 1) {
        group[0].x = group[0].baseX
        group[0].y = group[0].baseY
        group[0].scale = 1
      } else if (count === 2) {
        group[0].x = group[0].baseX - 10
        group[0].y = group[0].baseY
        group[0].scale = 0.82

        group[1].x = group[1].baseX + 10
        group[1].y = group[1].baseY
        group[1].scale = 0.82
      } else if (count === 3) {
        group[0].x = group[0].baseX
        group[0].y = group[0].baseY - 9
        group[0].scale = 0.72

        group[1].x = group[1].baseX - 9
        group[1].y = group[1].baseY + 7
        group[1].scale = 0.72

        group[2].x = group[2].baseX + 9
        group[2].y = group[2].baseY + 7
        group[2].scale = 0.72
      } else {
        // 4+ tokens
        const offsets = [
          { dx: -8, dy: -8 },
          { dx: 8, dy: -8 },
          { dx: -8, dy: 8 },
          { dx: 8, dy: 8 },
        ]
        group.forEach((item, idx) => {
          const off = offsets[idx % offsets.length]
          item.x = item.baseX + off.dx
          item.y = item.baseY + off.dy
          item.scale = 0.68
        })
      }
    }

    return list
  }, [players, animatingToken])

  return (
    <div className="ludo-board-wrapper">
      <svg
        viewBox="0 0 750 750"
        className="w-full h-full drop-shadow-2xl select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients for each player color */}
          {Object.entries(COLOR_CONFIG).map(([key, config]) => (
            <React.Fragment key={key}>
              {/* Pawn Head 3D Sphere */}
              <radialGradient
                id={`pawnHeadGrad-${key}`}
                cx="35%"
                cy="30%"
                r="70%"
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="35%" stopColor={config.hex} />
                <stop offset="100%" stopColor={config.accentHex} />
              </radialGradient>

              {/* Pawn Body Gradient */}
              <linearGradient
                id={`pawnBodyGrad-${key}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={config.accentHex} />
                <stop offset="30%" stopColor={config.hex} />
                <stop offset="70%" stopColor={config.hex} />
                <stop offset="100%" stopColor={config.accentHex} />
              </linearGradient>

              {/* Pawn Base Gradient */}
              <linearGradient
                id={`pawnBaseGrad-${key}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={config.hex} />
                <stop offset="100%" stopColor={config.accentHex} />
              </linearGradient>
            </React.Fragment>
          ))}
        </defs>

        {/* ── Outer Board Background & Frame ── */}
        <rect
          x="0"
          y="0"
          width="750"
          height="750"
          rx="18"
          fill="#0f172a"
        />

        {/* ── Base Areas (Four 6x6 Corners) ── */}
        {/* Red Base (Top-Left) */}
        <g>
          <rect
            x="8"
            y="8"
            width="284"
            height="284"
            rx="14"
            fill={COLOR_CONFIG.red.hex}
          />
          <rect
            x="45"
            y="45"
            width="210"
            height="210"
            rx="14"
            fill="#ffffff"
          />
          {/* 4 Token slots */}
          {BASE_SLOTS.red.map((slot, i) => (
            <circle
              key={i}
              cx={slot.c * CELL_SIZE}
              cy={slot.r * CELL_SIZE}
              r="22"
              fill={COLOR_CONFIG.red.bgHex}
              stroke={COLOR_CONFIG.red.hex}
              strokeWidth="3.5"
            />
          ))}
        </g>

        {/* Green Base (Top-Right) */}
        <g>
          <rect
            x="458"
            y="8"
            width="284"
            height="284"
            rx="14"
            fill={COLOR_CONFIG.green.hex}
          />
          <rect
            x="495"
            y="45"
            width="210"
            height="210"
            rx="14"
            fill="#ffffff"
          />
          {BASE_SLOTS.green.map((slot, i) => (
            <circle
              key={i}
              cx={slot.c * CELL_SIZE}
              cy={slot.r * CELL_SIZE}
              r="22"
              fill={COLOR_CONFIG.green.bgHex}
              stroke={COLOR_CONFIG.green.hex}
              strokeWidth="3.5"
            />
          ))}
        </g>

        {/* Yellow Base (Bottom-Right) */}
        <g>
          <rect
            x="458"
            y="458"
            width="284"
            height="284"
            rx="14"
            fill={COLOR_CONFIG.yellow.hex}
          />
          <rect
            x="495"
            y="495"
            width="210"
            height="210"
            rx="14"
            fill="#ffffff"
          />
          {BASE_SLOTS.yellow.map((slot, i) => (
            <circle
              key={i}
              cx={slot.c * CELL_SIZE}
              cy={slot.r * CELL_SIZE}
              r="22"
              fill={COLOR_CONFIG.yellow.bgHex}
              stroke={COLOR_CONFIG.yellow.hex}
              strokeWidth="3.5"
            />
          ))}
        </g>

        {/* Blue Base (Bottom-Left) */}
        <g>
          <rect
            x="8"
            y="458"
            width="284"
            height="284"
            rx="14"
            fill={COLOR_CONFIG.blue.hex}
          />
          <rect
            x="45"
            y="495"
            width="210"
            height="210"
            rx="14"
            fill="#ffffff"
          />
          {BASE_SLOTS.blue.map((slot, i) => (
            <circle
              key={i}
              cx={slot.c * CELL_SIZE}
              cy={slot.r * CELL_SIZE}
              r="22"
              fill={COLOR_CONFIG.blue.bgHex}
              stroke={COLOR_CONFIG.blue.hex}
              strokeWidth="3.5"
            />
          ))}
        </g>

        {/* ── 52 Common Track Cells ── */}
        {COMMON_TRACK.map((cell, idx) => {
          const isRedStart = idx === 0
          const isGreenStart = idx === 13
          const isYellowStart = idx === 26
          const isBlueStart = idx === 39
          const isStar = STAR_TRACK_INDICES.includes(idx)

          let fillColor = '#ffffff'
          let hasStartArrow = false
          let arrowColor = '#ffffff'
          let arrowDir = 'right'

          if (isRedStart) {
            fillColor = COLOR_CONFIG.red.hex
            hasStartArrow = true
            arrowDir = 'right'
          } else if (isGreenStart) {
            fillColor = COLOR_CONFIG.green.hex
            hasStartArrow = true
            arrowDir = 'down'
          } else if (isYellowStart) {
            fillColor = COLOR_CONFIG.yellow.hex
            hasStartArrow = true
            arrowDir = 'left'
          } else if (isBlueStart) {
            fillColor = COLOR_CONFIG.blue.hex
            hasStartArrow = true
            arrowDir = 'up'
          }

          const cx = cell.c * CELL_SIZE + CELL_SIZE / 2
          const cy = cell.r * CELL_SIZE + CELL_SIZE / 2

          return (
            <g key={`track-${idx}`}>
              <rect
                x={cell.c * CELL_SIZE}
                y={cell.r * CELL_SIZE}
                width={CELL_SIZE}
                height={CELL_SIZE}
                fill={fillColor}
                stroke="#cbd5e1"
                strokeWidth="1.2"
              />
              {/* Star on Safe Square */}
              {isStar && (
                <path
                  d={STAR_PATH}
                  transform={`translate(${cx}, ${cy}) scale(1.3)`}
                  fill="#f59e0b"
                  stroke="#1e293b"
                  strokeWidth="1.2"
                />
              )}
              {/* Start Arrow */}
              {hasStartArrow && (
                <g transform={`translate(${cx}, ${cy}) scale(1.6)`}>
                  <StartArrow direction={arrowDir} color={arrowColor} />
                </g>
              )}
            </g>
          )
        })}

        {/* ── Home Columns (5 Colored Cells per Color) ── */}
        {/* Red Home Column (Row 7, Col 1..5) */}
        {HOME_COLUMNS.red.map((cell, i) => (
          <rect
            key={`red-col-${i}`}
            x={cell.c * CELL_SIZE}
            y={cell.r * CELL_SIZE}
            width={CELL_SIZE}
            height={CELL_SIZE}
            fill={COLOR_CONFIG.red.hex}
            stroke="#b91c1c"
            strokeWidth="1.2"
          />
        ))}

        {/* Green Home Column (Row 1..5, Col 7) */}
        {HOME_COLUMNS.green.map((cell, i) => (
          <rect
            key={`green-col-${i}`}
            x={cell.c * CELL_SIZE}
            y={cell.r * CELL_SIZE}
            width={CELL_SIZE}
            height={CELL_SIZE}
            fill={COLOR_CONFIG.green.hex}
            stroke="#047857"
            strokeWidth="1.2"
          />
        ))}

        {/* Yellow Home Column (Row 7, Col 13..9) */}
        {HOME_COLUMNS.yellow.map((cell, i) => (
          <rect
            key={`yellow-col-${i}`}
            x={cell.c * CELL_SIZE}
            y={cell.r * CELL_SIZE}
            width={CELL_SIZE}
            height={CELL_SIZE}
            fill={COLOR_CONFIG.yellow.hex}
            stroke="#b45309"
            strokeWidth="1.2"
          />
        ))}

        {/* Blue Home Column (Row 13..9, Col 7) */}
        {HOME_COLUMNS.blue.map((cell, i) => (
          <rect
            key={`blue-col-${i}`}
            x={cell.c * CELL_SIZE}
            y={cell.r * CELL_SIZE}
            width={CELL_SIZE}
            height={CELL_SIZE}
            fill={COLOR_CONFIG.blue.hex}
            stroke="#1d4ed8"
            strokeWidth="1.2"
          />
        ))}

        {/* ── Center 3x3 Home Area (x: 300..450, y: 300..450) ── */}
        <g>
          {/* Red Left Triangle */}
          <polygon
            points="300,300 300,450 375,375"
            fill={COLOR_CONFIG.red.hex}
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          {/* Green Top Triangle */}
          <polygon
            points="300,300 450,300 375,375"
            fill={COLOR_CONFIG.green.hex}
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          {/* Yellow Right Triangle */}
          <polygon
            points="450,300 450,450 375,375"
            fill={COLOR_CONFIG.yellow.hex}
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          {/* Blue Bottom Triangle */}
          <polygon
            points="300,450 450,450 375,375"
            fill={COLOR_CONFIG.blue.hex}
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          {/* Center Trophy / Emblem */}
          <circle
            cx="375"
            cy="375"
            r="16"
            fill="#ffffff"
            stroke="#f59e0b"
            strokeWidth="2.5"
          />
          <text
            x="375"
            y="380"
            textAnchor="middle"
            fontSize="14"
            fill="#f59e0b"
            fontWeight="bold"
          >
            👑
          </text>
        </g>

        {/* ── Tokens Layer ── */}
        {tokenVisuals.map((item) => {
          const isSelectable =
            canSelect &&
            item.player.id === activePlayer.id &&
            legalMoves.includes(item.token.id)

          const isHopping =
            animatingToken &&
            animatingToken.playerId === item.player.id &&
            animatingToken.tokenId === item.token.id

          return (
            <LudoPawn
              key={`${item.player.id}-${item.token.id}`}
              token={item.token}
              player={item.player}
              x={item.x}
              y={item.y}
              scale={item.scale || 1}
              isSelectable={isSelectable}
              isHopping={isHopping}
              onClick={onSelectToken}
            />
          )
        })}
      </svg>
    </div>
  )
}
