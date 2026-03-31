import {useState, useCallback} from 'react';

type Slide = {
  url: string;
  alt: string;
};

type ImageSliderProps = {
  slides: Slide[];
};

export function ImageSlider({slides}: ImageSliderProps) {
  const [current, setCurrent] = useState(0);

  const prev = useCallback(() => {
    setCurrent((i) => (i === 0 ? slides.length - 1 : i - 1));
  }, [slides.length]);

  const next = useCallback(() => {
    setCurrent((i) => (i === slides.length - 1 ? 0 : i + 1));
  }, [slides.length]);

  if (slides.length === 0) return null;

  if (slides.length === 1) {
    return (
      <div className="slider-single">
        <img src={slides[0].url} alt={slides[0].alt} loading="lazy" />
      </div>
    );
  }

  return (
    <div className="slider">
      <div className="slider-track" style={{transform: `translateX(-${current * 100}%)`}}>
        {slides.map((slide, i) => (
          <div key={i} className="slider-slide">
            <img src={slide.url} alt={slide.alt} loading={i === 0 ? 'eager' : 'lazy'} />
          </div>
        ))}
      </div>

      <button className="slider-btn slider-btn-prev" onClick={prev} aria-label="Előző kép">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button className="slider-btn slider-btn-next" onClick={next} aria-label="Következő kép">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <div className="slider-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`slider-dot ${i === current ? 'active' : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`${i + 1}. kép`}
          />
        ))}
      </div>

      <div className="slider-counter">{current + 1} / {slides.length}</div>
    </div>
  );
}

/**
 * Extract <img> tags from HTML string and return slide data + cleaned HTML.
 */
export function extractImagesFromHtml(html: string): {slides: Slide[]; cleanHtml: string} {
  const imgRegex = /<img[^>]+src="([^"]+)"[^>]*(?:alt="([^"]*)")?[^>]*\/?>/gi;
  const slides: Slide[] = [];

  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    slides.push({url: match[1], alt: match[2] || ''});
  }

  const cleanHtml = html.replace(imgRegex, '').replace(/<p>\s*<\/p>/gi, '').trim();

  return {slides, cleanHtml};
}
