import {useState, useCallback, useRef, useEffect} from 'react';
import {createPortal} from 'react-dom';

type Slide = {
  url: string;
  alt: string;
  /** intrinsic size, so the first (LCP) image reserves its box before it loads */
  width?: number | null;
  height?: number | null;
};

type ImageSliderProps = {
  slides: Slide[];
};

/** Append ?width=X (or &width=X) to a Shopify CDN URL */
function shopifyUrl(url: string, width: number): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}width=${width}`;
}

/** Build a srcset string for a Shopify CDN image */
function shopifySrcSet(url: string, widths: number[]): string {
  return widths.map((w) => `${shopifyUrl(url, w)} ${w}w`).join(', ');
}

const SLIDE_WIDTHS = [400, 800, 1200, 1600];
const THUMB_WIDTHS = [80, 120];

export function ImageSlider({slides}: ImageSliderProps) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    trackRef.current?.style.setProperty('--slide-index', String(current));
    progressRef.current?.style.setProperty(
      '--progress',
      `${((current + 1) / slides.length) * 100}%`,
    );
  }, [current, slides.length]);

  const prev = useCallback(() => {
    setCurrent((i) => (i === 0 ? slides.length - 1 : i - 1));
  }, [slides.length]);

  const next = useCallback(() => {
    setCurrent((i) => (i === slides.length - 1 ? 0 : i + 1));
  }, [slides.length]);

  // Arrow keys page only while the zoom is open or focus is in the gallery,
  // so they keep scrolling the page and moving the caret everywhere else.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const focused = rootRef.current?.contains(document.activeElement) ?? false;
      if (!lightbox && !focused) return;
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape' && lightbox) setLightbox(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [prev, next, lightbox]);

  // Focus moves into the zoom when it opens and back to its trigger on close
  const wasOpen = useRef(false);
  useEffect(() => {
    if (lightbox) closeRef.current?.focus();
    else if (wasOpen.current) zoomRef.current?.focus();
    wasOpen.current = lightbox;
  }, [lightbox]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  if (slides.length === 0) return null;

  if (slides.length === 1) {
    return (
      <div className="slider-single">
        <img
          src={shopifyUrl(slides[0].url, 1200)}
          srcSet={shopifySrcSet(slides[0].url, SLIDE_WIDTHS)}
          sizes="(max-width: 600px) 100vw, (max-width: 1200px) 80vw, 1200px"
          alt={slides[0].alt}
          width={slides[0].width ?? undefined}
          height={slides[0].height ?? undefined}
          loading="eager"
          fetchPriority="high"
        />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="slider"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main stage */}
      <div className="slider-stage">
        <div ref={trackRef} className="slider-track">
          {slides.map((slide, i) => (
            <div key={i} className="slider-slide">
              <img
                src={shopifyUrl(slide.url, 1200)}
                srcSet={shopifySrcSet(slide.url, SLIDE_WIDTHS)}
                sizes="(max-width: 600px) 100vw, (max-width: 1200px) 80vw, 1200px"
                alt={slide.alt}
                width={i === 0 ? slide.width ?? undefined : undefined}
                height={i === 0 ? slide.height ?? undefined : undefined}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding={i === 0 ? undefined : 'async'}
                fetchPriority={i === 0 ? 'high' : 'low'}
              />
            </div>
          ))}
        </div>

        {/* covers the stage under the arrows: a click or Enter opens the zoom */}
        <button
          ref={zoomRef}
          type="button"
          className="slider-zoom"
          onClick={() => setLightbox(true)}
          aria-label={`Kép nagyítása (${current + 1}/${slides.length})`}
        />

        <button
          type="button"
          className="slider-btn slider-btn-prev"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Előző kép"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          type="button"
          className="slider-btn slider-btn-next"
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Következő kép"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <div className="slider-counter">
          <span className="slider-counter-current">{current + 1}</span>
          <span className="slider-counter-sep">/</span>
          <span className="slider-counter-total">{slides.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div ref={progressRef} className="slider-progress">
        <div className="slider-progress-fill" />
      </div>

      {/* Thumbnail strip */}
      <div className="slider-thumbs" role="tablist" aria-label="Képválasztó">
        {slides.map((slide, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            className={`slider-thumb ${i === current ? 'active' : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`${i + 1}. kép`}
          >
            <img
              src={shopifyUrl(slide.url, 120)}
              srcSet={shopifySrcSet(slide.url, THUMB_WIDTHS)}
              sizes="80px"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>

      {lightbox && typeof document !== 'undefined' && createPortal(
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- backdrop click closes; Escape is handled by the keydown listener
        <div
          className="slider-lightbox"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Kép nagyítva"
        >
          <button
            ref={closeRef}
            type="button"
            className="slider-lightbox-close"
            onClick={() => setLightbox(false)}
            aria-label="Bezárás"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {slides.length > 1 && (
            <button
              type="button"
              className="slider-lightbox-nav slider-lightbox-nav--prev"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Előző kép"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- only stops the backdrop click */}
          <img
            className="slider-lightbox-img"
            src={shopifyUrl(slides[current].url, 1600)}
            srcSet={shopifySrcSet(slides[current].url, SLIDE_WIDTHS)}
            sizes="92vw"
            alt={slides[current].alt}
            onClick={(e) => e.stopPropagation()}
          />
          {slides.length > 1 && (
            <button
              type="button"
              className="slider-lightbox-nav slider-lightbox-nav--next"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Következő kép"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

/**
 * Extract <img> tags from HTML string and return slide data + cleaned HTML.
 */
export function extractImagesFromHtml(html: string): {
  slides: {url: string; alt: string}[];
  cleanHtml: string;
} {
  const imgRegex = /<img[^>]+src="([^"]+)"(?:[^>]*alt="([^"]*)")?[^>]*\/?>/gi;
  const slides: {url: string; alt: string}[] = [];

  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    slides.push({url: match[1], alt: match[2] || ''});
  }

  const cleanHtml = html
    .replace(imgRegex, '')
    .replace(/<p>\s*<\/p>/gi, '')
    .trim();

  return {slides, cleanHtml};
}
