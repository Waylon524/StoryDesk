import type { Slide } from "../types";

interface SlideSummaryProps {
  title: string;
  slide: Pick<Slide, "title" | "body" | "bullets" | "note">;
}

export function SlideSummary({ title, slide }: SlideSummaryProps) {
  return (
    <div className="slide-summary">
      <span>{title}</span>
      <strong>{slide.title}</strong>
      <p>{slide.body}</p>
      <ul>
        {slide.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
      <small>{slide.note}</small>
    </div>
  );
}
