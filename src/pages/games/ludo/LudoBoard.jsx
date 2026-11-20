import React, { useMemo } from 'react'
import {
  BASE_POS,
  BASE_SLOTS,
  COLOR_CONFIG,
  COMMON_TRACK,
  GAME_PHASES,
  HOME_COLUMNS,
  HOME_POS,
  STAR_TRACK_INDICES,
} from './constants'

const CELL_SIZE = 50

const FINISHED_SLOTS = {
  red: [
    { x: 322, y: 346 },
    { x: 340, y: 364 },
    { x: 322, y: 386 },
    { x: 340, y: 404 },
  ],
  green: [
    { x: 346, y: 322 },
    { x: 364, y: 340 },
    { x: 386, y: 322 },
    { x: 404, y: 340 },
  ],
  yellow: [
    { x: 428, y: 346 },
    { x: 410, y: 364 },
    { x: 428, y: 386 },
    { x: 410, y: 404 },
  ],
  blue: [
    { x: 346, y: 428 },
    { x: 364, y: 410 },
    { x: 386, y: 428 },
    { x: 404, y: 410 },
  ],
}

// Star SVG path centered around (0,0)
const STAR_PATH =
  'M 0,-8 L 2.4,-2.6 L 8,-1.8 L 4,2.2 L 5.2,8 L 0,5 L -5.2,8 L -4,2.2 L -8,-1.8 L -2.4,-2.6 Z'

// Calculate pixel coordinates (x, y) for any (r, c)
function getCellPixelCenter(r, c) {
  return {
    x: c * CELL_SIZE + CELL_SIZE / 2,
    y: r * CELL_SIZE + CELL_SIZE / 2,
  }
}

// Arrow markers for Start cells
function StartArrow({ direction }) {
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

// Rotation per color so home-column chevrons point toward the center
const HOME_COLUMN_ANGLE = { red: 0, green: 90, yellow: 180, blue: 270 }

// Glossy Pawn Component
export function LudoPawn({
  token,
  player,
  x,
  y,
  scale = 1,
  isSelectable = false,
  isHopping = false,
  hopIndex = 0,
  onClick,
}) {
  const config = COLOR_CONFIG[player.color]

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${scale})`}
      className={`ludo-token-group ${isSelectable ? 'selectable' : ''}`}
      style={{ pointerEvents: isSelectable ? 'auto' : 'none' }}
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
      <circle cx="0" cy="-2" r="20" fill="transparent" />
      {isSelectable && (
        <circle
          className="ludo-select-ring"
          cx="0"
          cy="-2"
          r="22"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeDasharray="5 3"
        />
      )}
      <g
        key={isHopping ? `hop-${hopIndex}` : 'still'}
        className={`ludo-token-art ${isHopping ? 'is-hopping' : ''} ${isSelectable ? 'is-selectable' : ''}`}
      >

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
            scale: 0.9,
            cellKey,
            isBase: true,
            isHome: false,
          })
          continue
        } else         if (displayPos === HOME_POS) {
          const slot = FINISHED_SLOTS[player.color][token.id]
          list.push({
            token,
            player,
            x: slot.x,
            y: slot.y,
            scale: 0.62,
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
    for (const group of cellGroups.values()) {
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
        viewBox="-18 -18 786 786"
        className="ludo-board-svg select-none"
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

        {/* ── Wooden frame + parchment field ── */}
        <rect x="-18" y="-18" width="786" height="786" rx="26" fill="#4a2c14" />
        <rect x="-8" y="-8" width="766" height="766" rx="18" fill="#c9a36a" />
        <rect x="0" y="0" width="750" height="750" fill="#f7f1e4" />

        {/* ── Base Areas (Four 6x6 Corners) ── */}
        {[
          { color: 'red', x: 0, y: 0 },
          { color: 'green', x: 450, y: 0 },
          { color: 'yellow', x: 450, y: 450 },
          { color: 'blue', x: 0, y: 450 },
        ].map((base) => (
          <g key={base.color}>
            <rect
              x={base.x}
              y={base.y}
              width="300"
              height="300"
              fill={COLOR_CONFIG[base.color].hex}
            />
            <rect
              x={base.x + 28}
              y={base.y + 28}
              width="244"
              height="244"
              rx="28"
              fill="#fffaf3"
            />
            {BASE_SLOTS[base.color].map((slot, i) => (
              <circle
                key={i}
                cx={slot.c * CELL_SIZE}
                cy={slot.r * CELL_SIZE}
                r="24"
                fill={COLOR_CONFIG[base.color].bgHex}
                stroke={COLOR_CONFIG[base.color].hex}
                strokeWidth="3"
              />
            ))}
          </g>
        ))}

        {/* ── 52 Common Track Cells ── */}
        {COMMON_TRACK.map((cell, idx) => {
          const isRedStart = idx === 0
          const isGreenStart = idx === 13
          const isYellowStart = idx === 26
          const isBlueStart = idx === 39
          const isStar = STAR_TRACK_INDICES.includes(idx)

          let fillColor = '#fffdf8'
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
                stroke="#e4d3b0"
                strokeWidth="1.4"
              />
              {/* Star on Safe Square */}
              {isStar && (
                <path
                  d={STAR_PATH}
                  transform={`translate(${cx}, ${cy})`}
                  fill="#f59e0b"
                  stroke="#7c4a12"
                  strokeWidth="1"
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
        {Object.entries(HOME_COLUMNS).map(([color, cells]) => (
          <g key={`home-col-${color}`}>
            {cells.map((cell, i) => {
              const cx = cell.c * CELL_SIZE + CELL_SIZE / 2
              const cy = cell.r * CELL_SIZE + CELL_SIZE / 2
              return (
                <g key={`${color}-col-${i}`}>
                  <rect
                    x={cell.c * CELL_SIZE}
                    y={cell.r * CELL_SIZE}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    fill={COLOR_CONFIG[color].hex}
                    stroke={COLOR_CONFIG[color].accentHex}
                    strokeWidth="1.2"
                  />
                  <g
                    transform={`translate(${cx}, ${cy}) rotate(${HOME_COLUMN_ANGLE[color]})`}
                  >
                    <polygon points="-4.5,-4 4,0 -4.5,4" fill="#ffffff" opacity="0.9" />
                  </g>
                </g>
              )
            })}
          </g>
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
            r="18"
            fill="#ffffff"
            stroke="#f59e0b"
            strokeWidth="2.5"
          />
          <text
            x="375"
            y="381"
            textAnchor="middle"
            fontSize="16"
            fill="#f59e0b"
            fontWeight="bold"
          >
            👑
          </text>
        </g>

        {/* ── Tokens Layer ── */}
        {[...tokenVisuals]
          .sort((a, b) => {
            const aSelectable =
              canSelect && a.player.id === activePlayer?.id && legalMoves.includes(a.token.id)
            const bSelectable =
              canSelect && b.player.id === activePlayer?.id && legalMoves.includes(b.token.id)
            return Number(aSelectable) - Number(bSelectable)
          })
          .map((item) => {
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
              hopIndex={animatingToken ? animatingToken.hopIndex : 0}
              onClick={onSelectToken}
            />
          )
        })}
      </svg>
    </div>
  )
}
