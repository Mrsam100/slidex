'use client'

import type { Slide, Theme } from '@/types/deck'

interface SlideCanvasProps {
  slide: Slide
  theme: Theme
  isThumb?: boolean
}

export default function SlideCanvas({ slide, theme, isThumb }: SlideCanvasProps) {
  const t = isThumb // shorthand

  return (
    <div
      className="relative h-[720px] w-[1280px] shrink-0 overflow-hidden"
      style={{
        backgroundColor: theme.bgColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
        borderRadius: theme.borderRadius,
      }}
    >
      {slide.layout === 'title' && (
        <div
          className={`flex h-full flex-col items-center justify-center text-center ${t ? 'p-4' : 'p-16'}`}
        >
          <h1
            className={`font-bold leading-tight ${t ? 'text-lg' : 'text-5xl'}`}
            style={{ color: theme.headlineColor }}
          >
            {slide.headline}
          </h1>
          {slide.body && (
            <p
              className={`mt-6 max-w-2xl leading-relaxed opacity-80 ${t ? 'text-xs' : 'text-xl'}`}
            >
              {slide.body}
            </p>
          )}
          <div
            className="mt-8 h-1 w-24"
            style={{ backgroundColor: theme.accentColor }}
          />
        </div>
      )}

      {slide.layout === 'bullets' && (
        <div className={`flex h-full flex-col ${t ? 'p-4' : 'p-16'}`}>
          <h2
            className={`font-bold ${t ? 'text-lg' : 'text-5xl'}`}
            style={{ color: theme.headlineColor }}
          >
            {slide.headline}
          </h2>
          <ul className={t ? 'mt-4 flex-1 space-y-2' : 'mt-8 flex-1 space-y-5'}>
            {slide.bullets?.map((bullet, i) => (
              <li
                key={i}
                className={`flex items-start ${t ? 'gap-2' : 'gap-4'}`}
              >
                <span
                  className={`mt-1.5 shrink-0 ${t ? 'h-2 w-2' : 'h-3 w-3'}`}
                  style={{ backgroundColor: theme.accentColor }}
                />
                <span className={t ? 'text-xs' : 'text-lg'}>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {slide.layout === 'two-column' && (
        <div className={`flex h-full flex-col ${t ? 'p-4' : 'p-12'}`}>
          <h2
            className={`font-bold ${t ? 'text-lg' : 'text-5xl'}`}
            style={{ color: theme.headlineColor }}
          >
            {slide.headline}
          </h2>
          <div
            className={`mt-8 grid flex-1 grid-cols-2 ${t ? 'gap-4' : 'gap-12'}`}
          >
            <ul className={t ? 'space-y-1' : 'space-y-4'}>
              {slide.leftColumn?.map((item, i) => (
                <li
                  key={i}
                  className={`flex items-start ${t ? 'gap-2' : 'gap-3'}`}
                >
                  <span
                    className={`mt-1.5 shrink-0 ${t ? 'h-2 w-2' : 'h-3 w-3'}`}
                    style={{ backgroundColor: theme.accentColor }}
                  />
                  <span className={t ? 'text-xs' : 'text-lg'}>{item}</span>
                </li>
              ))}
            </ul>
            <ul className={t ? 'space-y-1' : 'space-y-4'}>
              {slide.rightColumn?.map((item, i) => (
                <li
                  key={i}
                  className={`flex items-start ${t ? 'gap-2' : 'gap-3'}`}
                >
                  <span
                    className={`mt-1.5 shrink-0 ${t ? 'h-2 w-2' : 'h-3 w-3'}`}
                    style={{ backgroundColor: theme.accentColor }}
                  />
                  <span className={t ? 'text-xs' : 'text-lg'}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {slide.layout === 'quote' && (
        <div
          className={`flex h-full flex-col items-center justify-center text-center ${t ? 'p-4' : 'p-16'}`}
        >
          <div
            className={`font-serif leading-none opacity-20 ${t ? 'text-3xl' : 'text-7xl'}`}
            style={{ color: theme.accentColor }}
          >
            &ldquo;
          </div>
          <blockquote
            className={`mt-2 max-w-3xl font-medium italic leading-relaxed ${t ? 'text-sm' : 'text-3xl'}`}
            style={{ color: theme.headlineColor }}
          >
            {slide.quote}
          </blockquote>
          {slide.attribution && (
            <p
              className={`mt-6 opacity-60 ${t ? 'text-xs' : 'text-base'}`}
            >
              &mdash; {slide.attribution}
            </p>
          )}
        </div>
      )}

      {slide.layout === 'image-text' && (
        <div className="flex h-full">
          <div
            className={`flex w-[55%] flex-col justify-center ${t ? 'p-4' : 'p-16'}`}
          >
            <h2
              className={`font-bold ${t ? 'text-lg' : 'text-5xl'}`}
              style={{ color: theme.headlineColor }}
            >
              {slide.headline}
            </h2>
            {slide.body && (
              <p
                className={`mt-4 leading-relaxed opacity-80 ${t ? 'text-xs' : 'text-xl'}`}
              >
                {slide.body}
              </p>
            )}
            {slide.bullets && (
              <ul className={t ? 'mt-3 space-y-1' : 'mt-6 space-y-3'}>
                {slide.bullets.map((bullet, i) => (
                  <li
                    key={i}
                    className={`flex items-start ${t ? 'gap-2' : 'gap-3'}`}
                  >
                    <span
                      className={`mt-1.5 shrink-0 ${t ? 'h-2 w-2' : 'h-3 w-3'}`}
                      style={{ backgroundColor: theme.accentColor }}
                    />
                    <span className={t ? 'text-xs' : 'text-lg'}>{bullet}</span>
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
            <div
              className="w-[45%]"
              style={{ backgroundColor: theme.accentColor, opacity: 0.15 }}
            />
          )}
        </div>
      )}

      {/* Fallback for unknown layout */}
      {!['title', 'bullets', 'two-column', 'quote', 'image-text'].includes(
        slide.layout,
      ) && (
        <div className={`flex h-full flex-col ${t ? 'p-4' : 'p-16'}`}>
          <h2
            className={`font-bold ${t ? 'text-lg' : 'text-5xl'}`}
            style={{ color: theme.headlineColor }}
          >
            {slide.headline}
          </h2>
          {slide.body && (
            <p
              className={`mt-4 leading-relaxed opacity-80 ${t ? 'text-xs' : 'text-xl'}`}
            >
              {slide.body}
            </p>
          )}
        </div>
      )}

      {/* Slide number */}
      <span
        className={`absolute opacity-40 ${t ? 'bottom-1 right-2 text-[8px]' : 'bottom-4 right-6 text-xs'}`}
      >
        {slide.position}
      </span>
    </div>
  )
}
