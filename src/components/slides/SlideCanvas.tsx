'use client'

import { memo } from 'react'
import type { Slide, Theme } from '@/types/deck'

interface SlideCanvasProps {
  slide: Slide
  theme: Theme
  isThumb?: boolean
}

export default memo(function SlideCanvas({ slide, theme, isThumb }: SlideCanvasProps) {
  const t = isThumb
  const isFun = !!theme.emojiSet

  // Deterministic emoji positions based on slide position
  const emojiPositions = isFun && theme.emojiSet ? getEmojiPositions(slide.position, theme.emojiSet) : []

  return (
    <div
      className="relative h-[720px] w-[1280px] shrink-0 overflow-hidden"
      style={{
        backgroundColor: theme.bgColor,
        ...(theme.bgGradient ? { backgroundImage: theme.bgGradient } : {}),
        color: theme.textColor,
        fontFamily: theme.fontFamily,
        borderRadius: theme.borderRadius,
      }}
    >
      {/* Mesh gradient overlay for gradient themes (non-fun) */}
      {theme.bgGradient && !isFun && !t && (
        <>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 20% 80%, rgba(249,115,22,0.3) 0%, transparent 70%)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 80% 20%, rgba(14,165,233,0.2) 0%, transparent 70%)',
            }}
          />
        </>
      )}
      {/* Fun theme: scattered background emoji */}
      {isFun && !t && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {emojiPositions.map((ep, i) => (
            <span
              key={i}
              className="absolute select-none"
              style={{
                left: `${ep.x}%`,
                top: `${ep.y}%`,
                fontSize: `${ep.size}px`,
                opacity: ep.opacity,
                transform: `rotate(${ep.rotate}deg)`,
              }}
            >
              {ep.emoji}
            </span>
          ))}
        </div>
      )}
      {/* Fun theme thumbnail: fewer emoji */}
      {isFun && t && theme.emojiSet && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {theme.emojiSet.slice(0, 4).map((emoji, i) => (
            <span
              key={i}
              className="absolute select-none"
              style={{
                left: `${[5, 80, 70, 15][i]}%`,
                top: `${[8, 75, 10, 80][i]}%`,
                fontSize: '14px',
                opacity: 0.25,
                transform: `rotate(${[-15, 20, -10, 25][i]}deg)`,
              }}
            >
              {emoji}
            </span>
          ))}
        </div>
      )}
      {/* Subtle decorative background pattern */}
      {!theme.bgGradient && !isFun && !t && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(${theme.accentColor} 0.5px, transparent 0.5px)`,
            backgroundSize: '24px 24px',
          }}
        />
      )}

      {slide.layout === 'title' && (
        <div
          className={`relative flex h-full flex-col items-center justify-center text-center ${t ? 'p-4' : 'px-24 py-16'}`}
        >
          {/* Decorative accent line above headline */}
          {!t && (
            <div
              className="mb-8 h-1 w-16 rounded-full"
              style={{ backgroundColor: theme.accentColor }}
            />
          )}
          <h1
            className={`font-bold tracking-tight ${t ? 'text-lg leading-tight' : 'text-[3.5rem] leading-[1.15]'}`}
            style={{ color: theme.headlineColor }}
          >
            {slide.headline}
          </h1>
          {slide.body && (
            <p
              className={`max-w-2xl leading-relaxed ${t ? 'mt-2 text-xs opacity-70' : 'mt-8 text-xl opacity-65'}`}
            >
              {slide.body}
            </p>
          )}
          {/* Bottom accent bar */}
          {!t && (
            <div
              className="absolute bottom-16 h-1 w-32 rounded-full"
              style={{ backgroundColor: theme.accentColor, opacity: 0.4 }}
            />
          )}
        </div>
      )}

      {slide.layout === 'bullets' && (
        <div className={`flex h-full flex-col ${t ? 'p-4' : 'p-16 pr-20'}`}>
          {/* Accent sidebar stripe */}
          {!isFun && !t && (
            <div
              className="absolute bottom-16 left-16 top-16 w-1 rounded-full"
              style={{ backgroundColor: theme.accentColor, opacity: 0.2 }}
            />
          )}
          <h2
            className={`font-bold tracking-tight ${t ? 'text-lg' : 'pl-6 text-[2.75rem] leading-[1.2]'}`}
            style={{ color: theme.headlineColor }}
          >
            {slide.headline}
          </h2>
          <ul className={t ? 'mt-4 flex-1 space-y-2' : 'mt-10 flex-1 space-y-6 pl-6'}>
            {slide.bullets?.map((bullet, i) => (
              <li
                key={i}
                className={`flex items-start ${t ? 'gap-2' : 'gap-5'}`}
              >
                {isFun && theme.emojiSet ? (
                  <span className={`shrink-0 ${t ? 'text-sm' : 'text-2xl'}`}>
                    {theme.emojiSet[i % theme.emojiSet.length]}
                  </span>
                ) : (
                  <span
                    className={`shrink-0 rounded-sm ${t ? 'mt-1 h-2 w-2' : 'mt-2 h-3 w-3'}`}
                    style={{ backgroundColor: theme.accentColor }}
                  />
                )}
                <span className={t ? 'text-xs' : 'text-xl leading-relaxed'}>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {slide.layout === 'two-column' && (
        <div className={`flex h-full flex-col ${t ? 'p-4' : 'p-16'}`}>
          <h2
            className={`font-bold tracking-tight ${t ? 'text-lg' : 'text-[2.75rem] leading-[1.2]'}`}
            style={{ color: theme.headlineColor }}
          >
            {slide.headline}
          </h2>
          <div
            className={`flex-1 grid grid-cols-2 ${t ? 'mt-4 gap-4' : 'mt-10 gap-16'}`}
          >
            {/* Column divider */}
            {!t && (
              <div
                className="absolute left-1/2 top-[45%] h-[40%] w-px -translate-x-1/2"
                style={{ backgroundColor: theme.accentColor, opacity: isFun ? 0.3 : 0.15 }}
              />
            )}
            <ul className={t ? 'space-y-1' : 'space-y-5'}>
              {slide.leftColumn?.map((item, i) => (
                <li
                  key={i}
                  className={`flex items-start ${t ? 'gap-2' : 'gap-4'}`}
                >
                  {isFun && theme.emojiSet ? (
                    <span className={`shrink-0 ${t ? 'text-sm' : 'text-xl'}`}>
                      {theme.emojiSet[i % theme.emojiSet.length]}
                    </span>
                  ) : (
                    <span
                      className={`shrink-0 rounded-sm ${t ? 'mt-1 h-2 w-2' : 'mt-2 h-3 w-3'}`}
                      style={{ backgroundColor: theme.accentColor }}
                    />
                  )}
                  <span className={t ? 'text-xs' : 'text-lg leading-relaxed'}>{item}</span>
                </li>
              ))}
            </ul>
            <ul className={t ? 'space-y-1' : 'space-y-5'}>
              {slide.rightColumn?.map((item, i) => (
                <li
                  key={i}
                  className={`flex items-start ${t ? 'gap-2' : 'gap-4'}`}
                >
                  {isFun && theme.emojiSet ? (
                    <span className={`shrink-0 ${t ? 'text-sm' : 'text-xl'}`}>
                      {theme.emojiSet[(i + 5) % theme.emojiSet.length]}
                    </span>
                  ) : (
                    <span
                      className={`shrink-0 rounded-sm ${t ? 'mt-1 h-2 w-2' : 'mt-2 h-3 w-3'}`}
                      style={{ backgroundColor: theme.accentColor }}
                    />
                  )}
                  <span className={t ? 'text-xs' : 'text-lg leading-relaxed'}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {slide.layout === 'quote' && (
        <div
          className={`relative flex h-full flex-col items-center justify-center text-center ${t ? 'p-4' : 'p-20'}`}
        >
          {/* Large decorative quote mark */}
          <div
            className={`font-serif leading-none ${t ? 'text-3xl' : 'text-[120px]'}`}
            style={{ color: theme.accentColor, opacity: 0.15 }}
          >
            &ldquo;
          </div>
          <blockquote
            className={`max-w-3xl font-medium italic leading-relaxed ${t ? '-mt-2 text-sm' : '-mt-8 text-[1.75rem]'}`}
            style={{ color: theme.headlineColor }}
          >
            {slide.quote}
          </blockquote>
          {slide.attribution && (
            <div className={`flex items-center gap-3 ${t ? 'mt-3' : 'mt-10'}`}>
              {!t && (
                <div
                  className="h-px w-8"
                  style={{ backgroundColor: theme.accentColor, opacity: 0.4 }}
                />
              )}
              <p
                className={`font-medium tracking-wide ${t ? 'text-xs opacity-50' : 'text-sm uppercase opacity-60'}`}
              >
                {slide.attribution}
              </p>
              {!t && (
                <div
                  className="h-px w-8"
                  style={{ backgroundColor: theme.accentColor, opacity: 0.4 }}
                />
              )}
            </div>
          )}
        </div>
      )}

      {slide.layout === 'image-text' && (
        <div className="flex h-full">
          <div
            className={`flex w-[55%] flex-col justify-center ${t ? 'p-4' : 'p-16 pr-12'}`}
          >
            <h2
              className={`font-bold tracking-tight ${t ? 'text-lg' : 'text-[2.75rem] leading-[1.2]'}`}
              style={{ color: theme.headlineColor }}
            >
              {slide.headline}
            </h2>
            {slide.body && (
              <p
                className={`leading-relaxed ${t ? 'mt-2 text-xs opacity-70' : 'mt-6 text-xl opacity-70'}`}
              >
                {slide.body}
              </p>
            )}
            {slide.bullets && (
              <ul className={t ? 'mt-3 space-y-1' : 'mt-8 space-y-4'}>
                {slide.bullets.map((bullet, i) => (
                  <li
                    key={i}
                    className={`flex items-start ${t ? 'gap-2' : 'gap-4'}`}
                  >
                    {isFun && theme.emojiSet ? (
                      <span className={`shrink-0 ${t ? 'text-sm' : 'text-xl'}`}>
                        {theme.emojiSet[(i + 2) % theme.emojiSet.length]}
                      </span>
                    ) : (
                      <span
                        className={`shrink-0 rounded-sm ${t ? 'mt-1 h-2 w-2' : 'mt-2 h-3 w-3'}`}
                        style={{ backgroundColor: theme.accentColor }}
                      />
                    )}
                    <span className={t ? 'text-xs' : 'text-lg leading-relaxed'}>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {slide.imageUrl ? (
            <div className="relative w-[45%] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="relative w-[45%] overflow-hidden">
              <div
                className="absolute inset-0"
                style={{ backgroundColor: theme.accentColor, opacity: 0.08 }}
              />
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.accentColor} 25%, transparent 25%, transparent 50%, ${theme.accentColor} 50%, ${theme.accentColor} 75%, transparent 75%)`,
                  backgroundSize: '40px 40px',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Fallback for unknown layout */}
      {!['title', 'bullets', 'two-column', 'quote', 'image-text'].includes(
        slide.layout,
      ) && (
        <div className={`flex h-full flex-col ${t ? 'p-4' : 'p-16'}`}>
          <h2
            className={`font-bold tracking-tight ${t ? 'text-lg' : 'text-[2.75rem] leading-[1.2]'}`}
            style={{ color: theme.headlineColor }}
          >
            {slide.headline}
          </h2>
          {slide.body && (
            <p
              className={`leading-relaxed opacity-75 ${t ? 'mt-2 text-xs' : 'mt-6 text-xl'}`}
            >
              {slide.body}
            </p>
          )}
        </div>
      )}

      {/* Slide number — fun theme gets emoji */}
      <span
        className={`absolute font-medium ${t ? 'bottom-1 right-2 text-[8px] opacity-30' : 'bottom-5 right-7 text-[11px] opacity-30'}`}
      >
        {isFun ? `✨ ${slide.position}` : slide.position}
      </span>
    </div>
  )
})

/** Generate deterministic scattered emoji positions for fun theme background */
function getEmojiPositions(slidePosition: number, emojiSet: string[]) {
  const count = 12
  const positions: { x: number; y: number; size: number; opacity: number; rotate: number; emoji: string }[] = []
  // Simple seeded pseudo-random based on slide position
  let seed = slidePosition * 7919
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647
    return (seed & 0x7fffffff) / 2147483647
  }
  for (let i = 0; i < count; i++) {
    positions.push({
      x: rand() * 90 + 2,
      y: rand() * 85 + 5,
      size: 28 + rand() * 24,
      opacity: 0.08 + rand() * 0.12,
      rotate: -30 + rand() * 60,
      emoji: emojiSet[Math.floor(rand() * emojiSet.length)] ?? '✨',
    })
  }
  return positions
}
