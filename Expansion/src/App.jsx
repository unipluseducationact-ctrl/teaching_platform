import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft, ChevronRight, Menu, PackageOpen,
  PanelLeftClose, PanelLeftOpen, RotateCcw,
} from 'lucide-react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import './App.css'

const FOOD_IMG = {
  y: `${import.meta.env.BASE_URL}images/sandwich-y.png`,
  h: `${import.meta.env.BASE_URL}images/bread-h.png`,
  k: `${import.meta.env.BASE_URL}images/bread-k.png`,
}

/** Shared drag payload — HTML5 getData can fail on some browsers mid-drag. */
let activeDragType = null

const pairs = [
  {
    id: 'pair-30',
    totalFood: 30,
    linkNote: 'Both packings make 30 pieces of food.',
    lessons: [
      {
        id: 'mono-30',
        kind: 'mono',
        title: '5 Boxes × 6 Sandwiches',
        expression: String.raw`(5x)(6y)`,
        result: String.raw`30xy`,
        subtitle: '5 × 6 sandwiches',
        story: '5 lunch boxes. Each box gets 6 sandwiches.',
        hint: 'Drag or tap sandwiches into every box.',
        maxStep: 2,
        steps: [
          {
            title: 'See the boxes',
            text: 'There are 5 empty lunch boxes.',
            latex: String.raw`5x \Rightarrow 5 \text{ empty lunch boxes}`,
          },
          {
            title: 'Pack sandwiches',
            text: 'Put 6 sandwiches into each box.',
            latex: String.raw`\text{Each box needs } 6y`,
          },
          {
            title: 'Check the total',
            text: '5 boxes times 6 sandwiches.',
            latex: String.raw`5 \times 6 = 30xy`,
          },
        ],
        boxes: Array.from({ length: 5 }, (_, i) => ({ id: `x${i}`, label: 'x', color: 'blue' })),
        needs: { y: 6 },
      },
      {
        id: 'quad-30',
        kind: 'quad',
        title: 'Two Box Types × Two Breads',
        expression: String.raw`(2a+3b)(4h+2k)`,
        result: String.raw`8ah+4ak+12bh+6bk`,
        subtitle: '5 boxes × (4h + 2k)',
        story: '2 yellow a-boxes and 3 red b-boxes. Each gets 4h then 2k.',
        hint: 'First pack 4h into every box, then pack 2k.',
        maxStep: 3,
        steps: [
          {
            title: 'See the boxes',
            text: '2 yellow and 3 red boxes — 5 boxes total.',
            latex: String.raw`2a + 3b \Rightarrow 5 \text{ boxes}`,
          },
          {
            title: 'Pack french bread',
            text: 'Put 4 french breads into every box.',
            latex: String.raw`4h \text{ in each box}`,
          },
          {
            title: 'Pack white bread',
            text: 'Put 2 white breads into every box.',
            latex: String.raw`2k \text{ in each box}`,
          },
          {
            title: 'Four pairings',
            text: 'Collect all products. Total food is 30.',
            latex: String.raw`8ah + 4ak + 12bh + 6bk \quad (5 \times 6 = 30)`,
          },
        ],
        boxes: [
          { id: 'a0', label: 'a', color: 'yellow' },
          { id: 'a1', label: 'a', color: 'yellow' },
          { id: 'b0', label: 'b', color: 'red' },
          { id: 'b1', label: 'b', color: 'red' },
          { id: 'b2', label: 'b', color: 'red' },
        ],
        needs: { h: 4, k: 2 },
        terms: [
          { box: '2a', bread: '4h', value: '8ah', color: 'yellow', kind: 'h' },
          { box: '2a', bread: '2k', value: '4ak', color: 'yellow', kind: 'k' },
          { box: '3b', bread: '4h', value: '12bh', color: 'red', kind: 'h' },
          { box: '3b', bread: '2k', value: '6bk', color: 'red', kind: 'k' },
        ],
      },
    ],
  },
]

function emptyContents(boxes) {
  return Object.fromEntries(boxes.map((b) => [b.id, []]))
}

function countType(list, type) {
  return list.filter((t) => t === type).length
}

function boxComplete(contents, needs) {
  return Object.entries(needs).every(([type, n]) => countType(contents, type) >= n)
}

function allBoxesComplete(boxes, contents, needs) {
  return boxes.every((b) => boxComplete(contents[b.id] || [], needs))
}

function phaseNeeds(lesson, phaseType) {
  if (!phaseType) return lesson.needs
  return { [phaseType]: lesson.needs[phaseType] }
}

function Latex({ tex, className = '' }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode: false })
    } catch {
      return tex
    }
  }, [tex])
  return <span className={`latex ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
}

function LunchBoxShell({ color = 'blue' }) {
  const fill = color === 'yellow' ? '#fff4c8' : color === 'red' ? '#ffe4e0' : '#dff0fb'
  const stroke = color === 'yellow' ? '#d4a82a' : color === 'red' ? '#c45a52' : '#4a96c8'
  const lid = color === 'yellow' ? '#f5e09a' : color === 'red' ? '#f5c8c4' : '#c5e4f5'
  return (
    <svg viewBox="0 0 120 100" className="lunchbox-svg" aria-hidden="true">
      <rect x="8" y="28" width="104" height="64" rx="12" fill={fill} stroke={stroke} strokeWidth="3.5" />
      <rect x="8" y="18" width="104" height="22" rx="10" fill={lid} stroke={stroke} strokeWidth="3.5" />
      <rect x="8" y="28" width="104" height="8" fill={lid} stroke="none" />
      <rect x="48" y="12" width="24" height="14" rx="5" fill={stroke} opacity=".85" />
      <rect x="52" y="15" width="16" height="8" rx="3" fill="#fff" opacity=".35" />
      <rect x="18" y="42" width="84" height="42" rx="8" fill="#fff" opacity=".45" stroke={stroke} strokeWidth="1.2" strokeOpacity=".3" />
    </svg>
  )
}

function BreadImg({ type, size = 40, className = '', style }) {
  if (type === 'k') {
    return (
      <svg className={`bread-img bread-svg ${className}`} width={size} height={size} viewBox="0 0 48 48" style={style} aria-label="white bread">
        <rect x="5" y="9" width="38" height="30" rx="9" fill="#f3d9a0" stroke="#c4923a" strokeWidth="2.5" />
        <rect x="9" y="13" width="30" height="22" rx="6" fill="#ffe9b8" stroke="#d4a85a" strokeWidth="1.5" />
        <ellipse cx="17" cy="24" rx="2.4" ry="2.4" fill="#e0b86a" />
        <ellipse cx="24" cy="22" rx="2.2" ry="2.2" fill="#e0b86a" />
        <ellipse cx="31" cy="25" rx="2.4" ry="2.4" fill="#e0b86a" />
      </svg>
    )
  }
  return (
    <img
      src={FOOD_IMG[type]}
      alt={type === 'y' ? 'sandwich' : 'french bread'}
      className={`bread-img ${className}`}
      width={size}
      height={size}
      style={style}
      draggable={false}
    />
  )
}

function DraggableFood({ type, size = 56, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`drag-food ${selected ? 'selected' : ''}`}
      draggable
      onDragStart={(e) => {
        activeDragType = type
        e.dataTransfer.setData('text/plain', type)
        e.dataTransfer.setData('foodType', type)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onDragEnd={() => { activeDragType = null }}
      onClick={() => onSelect(type)}
      aria-label={`Pick ${type}`}
    >
      <BreadImg type={type} size={size} />
    </button>
  )
}

function GraphicKey() {
  return (
    <div className="graphic-key" aria-label="Symbol key">
      <span className="key-badge">KEY</span>
      <span className="key-item"><i className="swatch yellow" /><Latex tex={String.raw`a`} /> yellow lunch box</span>
      <span className="key-item"><i className="swatch red" /><Latex tex={String.raw`b`} /> red lunch box</span>
      <span className="key-item"><i className="swatch blue" /><Latex tex={String.raw`x`} /> blue lunch box</span>
      <span className="key-item"><BreadImg type="h" size={22} /><Latex tex={String.raw`h`} /> long bread</span>
      <span className="key-item"><BreadImg type="k" size={22} /><Latex tex={String.raw`k`} /> white bread</span>
      <span className="key-item"><BreadImg type="y" size={22} /><Latex tex={String.raw`y`} /> sandwich</span>
    </div>
  )
}

function ExpressionHeading({ expression, subtitle, className = '' }) {
  return (
    <div className={`expression-heading ${className}`.trim()}>
      <Latex tex={expression} />
      <span>{subtitle}</span>
    </div>
  )
}

function FoodGrid({ foods, highlight, onFoodClick, interactive }) {
  return (
    <div className={`lunchbox-foods cols-${Math.min(3, foods.length)}`}>
      {foods.map((type, i) => {
        const dimmed = highlight && type !== highlight
        const lit = highlight && type === highlight
        return (
          <button
            key={`${type}-${i}`}
            type="button"
            className={`food-slot ${dimmed ? 'dim' : ''} ${lit ? 'lit' : ''} ${interactive ? 'clickable' : ''}`}
            disabled={!interactive}
            onClick={(e) => {
              e.stopPropagation()
              onFoodClick?.(type)
            }}
          >
            <BreadImg type={type} className="in-box" />
          </button>
        )
      })}
    </div>
  )
}

/** Shared mono reference: (5x)(6y) + 5 boxes × 6 sandwiches */
function MonoShowcase({ boxes, compact = false }) {
  const foods = Array.from({ length: 6 }, () => 'y')
  return (
    <section className={`mono-showcase ${compact ? 'compact' : ''}`}>
      <ExpressionHeading expression={String.raw`(5x)(6y)`} subtitle="5 × 6 sandwiches" />
      <div className="box-row mono-five tight">
        {boxes.map((box, i) => (
          <FilledBox key={box.id} color={box.color} foods={foods} delay={i * 40} />
        ))}
      </div>
    </section>
  )
}

function FilledBox({
  color,
  foods,
  delay = 0,
  foodHighlight = null,
  boxState = 'normal', // normal | lit | dim
  onFoodClick,
  interactive = false,
}) {
  return (
    <div
      className={`lunchbox filled-static box-${boxState} ${foodHighlight ? 'has-highlight' : ''}`}
      style={{ '--delay': `${delay}ms` }}
    >
      <LunchBoxShell color={color} />
      <FoodGrid foods={foods} highlight={foodHighlight} onFoodClick={onFoodClick} interactive={interactive} />
      <span className="box-count ok">{foods.length}</span>
    </div>
  )
}

function LunchBoxDrop({ box, foods, needs, activeType, selectedType, onDropFood, delay = 0 }) {
  const [over, setOver] = useState(false)
  const done = boxComplete(foods, needs)
  const currentNeed = activeType ? needs[activeType] : null
  const have = activeType ? countType(foods, activeType) : foods.length

  const receive = (type) => {
    if (type) onDropFood(box.id, type)
  }

  return (
    <div
      className={`lunchbox ${over ? 'drag-over' : ''} ${done ? 'done' : ''} ${selectedType ? 'awaiting' : ''}`}
      style={{ '--delay': `${delay}ms` }}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const type = e.dataTransfer.getData('foodType')
          || e.dataTransfer.getData('text/plain')
          || activeDragType
        receive(type)
      }}
      onClick={() => {
        if (selectedType) receive(selectedType)
      }}
    >
      <LunchBoxShell color={box.color} />
      {foods.length === 0 && <span className="lunchbox-label">{box.label}</span>}
      {foods.length > 0 && <FoodGrid foods={foods} />}
      {activeType && (
        <span className={`box-count ${done ? 'ok' : ''}`}>{have}/{currentNeed}</span>
      )}
    </div>
  )
}

const COMPARE_TERMS = [
  { id: 'ah', tex: String.raw`8ah`, box: 'yellow', food: 'h', note: String.raw`2a \times 4h = 8ah` },
  { id: 'ak', tex: String.raw`4ak`, box: 'yellow', food: 'k', note: String.raw`2a \times 2k = 4ak` },
  { id: 'bh', tex: String.raw`12bh`, box: 'red', food: 'h', note: String.raw`3b \times 4h = 12bh` },
  { id: 'bk', tex: String.raw`6bk`, box: 'red', food: 'k', note: String.raw`3b \times 2k = 6bk` },
]

function CompareView({ pair }) {
  const mono = pair.lessons[0]
  const quad = pair.lessons[1]
  const [selected, setSelected] = useState(null) // { box, food, id? } | null
  const quadFoods = [...Array.from({ length: 4 }, () => 'h'), ...Array.from({ length: 2 }, () => 'k')]

  const foodHighlight = selected?.food ?? null
  const boxFilter = selected?.box ?? null

  const formula = foodHighlight === 'h' && !boxFilter
    ? String.raw`(2a+3b)(4h)`
    : foodHighlight === 'k' && !boxFilter
      ? String.raw`(2a+3b)(2k)`
      : selected?.id === 'ah'
        ? String.raw`2a \times 4h`
        : selected?.id === 'ak'
          ? String.raw`2a \times 2k`
          : selected?.id === 'bh'
            ? String.raw`3b \times 4h`
            : selected?.id === 'bk'
              ? String.raw`3b \times 2k`
              : String.raw`(2a+3b)(4h+2k)`

  const formulaNote = selected
    ? (COMPARE_TERMS.find((t) => t.id === selected.id)?.note
      || (foodHighlight === 'h'
        ? String.raw`5 \times 4h = 20h \text{ items}`
        : foodHighlight === 'k'
          ? String.raw`5 \times 2k = 10k \text{ items}`
          : String.raw`5 \times 6 = 30`))
    : String.raw`5 \times 6 = 30`

  const toggleTerm = (term) => {
    setSelected((prev) => (prev?.id === term.id ? null : { id: term.id, box: term.box, food: term.food }))
  }

  const toggleFood = (type) => {
    setSelected((prev) => (
      prev && !prev.id && prev.food === type
        ? null
        : { box: null, food: type }
    ))
  }

  const boxStateFor = (color) => {
    if (!selected || !foodHighlight) return 'normal'
    if (!boxFilter) return 'lit'
    return color === boxFilter ? 'lit' : 'dim'
  }

  return (
    <div className="compare-view">
      <div className="compare-equals">
        <Latex tex={String.raw`30xy`} />
        <span className="equals-badge">30 = 30</span>
        <div className="term-taps" aria-label="Expanded terms">
          {COMPARE_TERMS.map((term, i) => (
            <span key={term.id} className="term-tap-wrap">
              {i > 0 && <span className="term-plus">+</span>}
              <button
                type="button"
                className={`term-tap ${selected?.id === term.id ? 'on' : ''}`}
                onClick={() => toggleTerm(term)}
              >
                <Latex tex={term.tex} />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="compare-grid">
        <section className="compare-side">
          <MonoShowcase boxes={mono.boxes} />
          <p className="compare-total"><Latex tex={String.raw`30`} /></p>
        </section>

        <div className="compare-divider"><span>30</span><small>=</small><span>30</span></div>

        <section className="compare-side interactive-side">
          <div className="highlight-bar">
            <button type="button" className={!selected?.id && selected?.food === 'h' ? 'on' : ''} onClick={() => toggleFood('h')}>
              Long bread <Latex tex={String.raw`4h`} />
            </button>
            <button type="button" className={!selected?.id && selected?.food === 'k' ? 'on' : ''} onClick={() => toggleFood('k')}>
              White bread <Latex tex={String.raw`2k`} />
            </button>
          </div>
          <ExpressionHeading
            expression={formula}
            subtitle="Tap a term above or a bread type"
            className="interactive"
          />
          <div className="box-group compact">
            <span className="tag yellow-tag">2a</span>
            <div className="box-row tight">
              {quad.boxes.filter((b) => b.color === 'yellow').map((box, i) => (
                <FilledBox
                  key={box.id}
                  color={box.color}
                  foods={quadFoods}
                  delay={i * 40}
                  foodHighlight={foodHighlight}
                  boxState={boxStateFor('yellow')}
                  onFoodClick={toggleFood}
                  interactive
                />
              ))}
            </div>
          </div>
          <div className="box-group compact">
            <span className="tag red-tag">3b</span>
            <div className="box-row tight">
              {quad.boxes.filter((b) => b.color === 'red').map((box, i) => (
                <FilledBox
                  key={box.id}
                  color={box.color}
                  foods={quadFoods}
                  delay={i * 40 + 60}
                  foodHighlight={foodHighlight}
                  boxState={boxStateFor('red')}
                  onFoodClick={toggleFood}
                  interactive
                />
              ))}
            </div>
          </div>
          <p className="compare-total"><Latex tex={formulaNote} /></p>
        </section>
      </div>
    </div>
  )
}

function PackingVisual({ lesson, step, contents, setContents, feedback, setFeedback, selectedType, setSelectedType }) {
  const isMono = lesson.kind === 'mono'
  const activeType = useMemo(() => {
    if (step === 0) return null
    if (isMono) return step === 1 ? 'y' : null
    if (step === 1) return 'h'
    if (step === 2) return 'k'
    return null
  }, [step, isMono])

  const needsForPhase = activeType ? phaseNeeds(lesson, activeType) : lesson.needs

  useEffect(() => {
    setSelectedType(null)
  }, [step, setSelectedType])

  const onDropFood = (boxId, type) => {
    if (!activeType) {
      setFeedback('Packing starts on the next step.')
      return
    }
    if (type !== activeType) {
      setFeedback(activeType === 'h'
        ? 'Pack french bread (h) first.'
        : activeType === 'k'
          ? 'Now pack white bread (k) only.'
          : 'Use sandwiches (y).')
      return
    }
    setContents((prev) => {
      const current = prev[boxId] || []
      const have = countType(current, type)
      const need = lesson.needs[type]
      if (have >= need) {
        setFeedback(`This box already has ${need}.`)
        return prev
      }
      setFeedback('')
      return { ...prev, [boxId]: [...current, type] }
    })
  }

  const yellowBoxes = lesson.boxes.filter((b) => b.color === 'yellow')
  const redBoxes = lesson.boxes.filter((b) => b.color === 'red')
  const blueBoxes = lesson.boxes.filter((b) => b.color === 'blue')
  const hDone = !isMono && lesson.boxes.every((b) => countType(contents[b.id] || [], 'h') >= lesson.needs.h)
  const allDone = allBoxesComplete(lesson.boxes, contents, lesson.needs)
  const revealedTerms = isMono ? 0 : allDone && step >= 3 ? 4 : hDone && step >= 1 ? 2 : 0

  const supplyCount = 4

  return (
    <div className="visual">
      <p className="caption">
        {step === 0 && (isMono ? '5 empty lunch boxes' : '2 yellow a-boxes · 3 red b-boxes')}
        {step === 1 && (isMono ? 'Drag or tap: 6 sandwiches per box' : 'Drag or tap: 4 french breads (h) per box')}
        {step === 2 && (isMono ? 'Total packed' : 'Drag or tap: 2 white breads (k) per box')}
        {step === 3 && 'Four pairings — total 30 foods'}
      </p>

      <div className={`scene ${isMono ? 'mono-scene' : 'quad-scene'}`}>
        {isMono ? (
          <div className="box-row mono-five">
            {blueBoxes.map((box, i) => (
              <LunchBoxDrop key={box.id} box={box} foods={contents[box.id] || []} needs={needsForPhase} activeType={activeType} selectedType={selectedType} onDropFood={onDropFood} delay={i * 40} />
            ))}
          </div>
        ) : (
          <>
            <div className="box-group compact">
              <span className="tag yellow-tag">2a</span>
              <div className="box-row">
                {yellowBoxes.map((box, i) => (
                  <LunchBoxDrop key={box.id} box={box} foods={contents[box.id] || []} needs={needsForPhase} activeType={activeType} selectedType={selectedType} onDropFood={onDropFood} delay={i * 40} />
                ))}
              </div>
            </div>
            <div className="box-group compact">
              <span className="tag red-tag">3b</span>
              <div className="box-row">
                {redBoxes.map((box, i) => (
                  <LunchBoxDrop key={box.id} box={box} foods={contents[box.id] || []} needs={needsForPhase} activeType={activeType} selectedType={selectedType} onDropFood={onDropFood} delay={i * 40 + 60} />
                ))}
              </div>
            </div>
          </>
        )}

        {activeType && (
          <div className="food-pile supply">
            <span className="pile-label">
              {selectedType ? 'Tap a lunch box to pack' : 'Drag or tap food, then tap a box'}
            </span>
            <div className="pile-items">
              {Array.from({ length: supplyCount }).map((_, i) => (
                <DraggableFood
                  key={`${activeType}-${i}`}
                  type={activeType}
                  size={52}
                  selected={selectedType === activeType}
                  onSelect={setSelectedType}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {feedback && <p className="feedback-msg">{feedback}</p>}

      {!isMono && revealedTerms > 0 && (
        <div className="term-grid">
          {(revealedTerms === 2
            ? lesson.terms.filter((t) => t.kind === 'h')
            : lesson.terms
          ).map((t, i) => (
            <div key={t.value} className={`term-chip ${t.color}`} style={{ '--delay': `${i * 60}ms` }}>
              <Latex tex={String.raw`${t.box}\times ${t.bread}=${t.value}`} />
            </div>
          ))}
        </div>
      )}

      {step >= 2 && isMono && allDone && (
        <p className="result-line"><Latex tex={String.raw`5\times 6 = 30xy`} /></p>
      )}
      {step >= 3 && !isMono && (
        <p className="result-line link-note"><Latex tex={String.raw`5\times 6 = 30`} /> — same total as the first lesson</p>
      )}
    </div>
  )
}

function canAdvance(lesson, step, contents) {
  if (step === 0) return true
  if (lesson.kind === 'mono') {
    if (step === 1) return allBoxesComplete(lesson.boxes, contents, { y: 6 })
    return true
  }
  if (step === 1) return lesson.boxes.every((b) => countType(contents[b.id] || [], 'h') >= 4)
  if (step === 2) return allBoxesComplete(lesson.boxes, contents, lesson.needs)
  return true
}

function App() {
  const pair = pairs[0]
  const [tab, setTab] = useState(0)
  const [step, setStep] = useState(0)
  const [contents, setContents] = useState(() => emptyContents(pair.lessons[0].boxes))
  const [feedback, setFeedback] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedType, setSelectedType] = useState(null)

  const isCompare = tab === 2
  const lesson = pair.lessons[isCompare ? 0 : tab]
  const maxStep = lesson.maxStep ?? 3

  useEffect(() => {
    if (isCompare) return
    setContents(emptyContents(lesson.boxes))
    setFeedback('')
    setSelectedType(null)
    setStep(0)
  }, [tab, isCompare, lesson.boxes])

  const advanceOk = isCompare ? true : canAdvance(lesson, step, contents)

  const goNext = () => {
    if (!advanceOk) {
      setFeedback('Finish packing every box first.')
      return
    }
    setFeedback('')
    setSelectedType(null)
    if (step < maxStep) setStep(step + 1)
    else {
      setContents(emptyContents(lesson.boxes))
      setStep(0)
    }
  }

  const pickTab = (i) => {
    setTab(i)
    if (window.matchMedia('(max-width: 900px)').matches) setSidebarOpen(false)
  }

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="brand">
            <PackageOpen size={20} />
            {sidebarOpen && <strong>Lunch Box</strong>}
          </div>
          <button className="icon-btn" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle sidebar">
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>
        {sidebarOpen && (
          <>
            <p className="sidebar-note">{pair.linkNote}</p>
            <nav className="side-nav">
              {pair.lessons.map((l, i) => (
                <button key={l.id} className={tab === i ? 'active' : ''} onClick={() => pickTab(i)}>
                  <span className="nav-num">{i + 1}</span>
                  <span className="nav-text">
                    <small>{l.kind === 'mono' ? 'Monomial' : 'Four pairings'}</small>
                    <strong>{l.expression}</strong>
                  </span>
                </button>
              ))}
              <button className={isCompare ? 'active' : ''} onClick={() => pickTab(2)}>
                <span className="nav-num">=</span>
                <span className="nav-text">
                  <small>Compare</small>
                  <strong>30 = 30</strong>
                </span>
              </button>
            </nav>
          </>
        )}
      </aside>

      {sidebarOpen && <button className="scrim" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />}

      <div className="workspace">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="topbar-title">
            <h1>{isCompare ? 'Compare: both make 30' : lesson.title}</h1>
            {!isCompare && <p>{lesson.story}</p>}
          </div>
          <span className="badge">Form 2</span>
        </header>

        <GraphicKey />

        {isCompare ? (
          <CompareView pair={pair} />
        ) : (
          <div className="lesson-body">
            <ExpressionHeading expression={lesson.expression} subtitle={lesson.subtitle} />

            <div className="panel">
              <div className="visual-panel">
                <div className="panel-head">
                  Picture <small>{step + 1}/{maxStep + 1}</small>
                </div>
                <PackingVisual
                  lesson={lesson}
                  step={step}
                  contents={contents}
                  setContents={setContents}
                  feedback={feedback}
                  setFeedback={setFeedback}
                  selectedType={selectedType}
                  setSelectedType={setSelectedType}
                />
              </div>

              <div className="step-panel">
                <div className="dots">
                  {Array.from({ length: maxStep + 1 }).map((_, i) => (
                    <i key={i} className={i <= step ? 'on' : ''} />
                  ))}
                </div>
                <span className="step-num">Step {step + 1}</span>
                <h2>{lesson.steps[step].title}</h2>
                <p className="step-text">{lesson.steps[step].text}</p>
                <div className="step-latex">
                  <Latex tex={lesson.steps[step].latex} />
                </div>
                <p className="hint">{lesson.hint}</p>
                {!advanceOk && step > 0 && step < maxStep && (
                  <p className="gate-note">Pack every box to unlock Next.</p>
                )}
                <div className="btns">
                  <button className="btn-back" onClick={() => { setFeedback(''); setSelectedType(null); setStep(Math.max(0, step - 1)) }} disabled={step === 0}>
                    <ChevronLeft size={16} /> Back
                  </button>
                  {step < maxStep ? (
                    <button className="btn-next" onClick={goNext} disabled={!advanceOk}>
                      Next <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button className="btn-next" onClick={goNext}>
                      <RotateCcw size={16} /> Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
