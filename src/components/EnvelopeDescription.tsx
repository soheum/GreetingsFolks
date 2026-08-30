"use client";

function DescriptionAsterisk({ note }: { note: string }) {
  return (
    <span className="group/asterisk relative inline">
      <button
        type="button"
        className="mx-0.5 cursor-help align-super text-[0.65em] leading-none text-neutral-500 underline decoration-dotted underline-offset-2"
        aria-label="Show reference note"
      >
        *
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-56 -translate-x-1/2 rounded-md bg-neutral-900 px-3 py-2 text-left text-xs leading-relaxed font-normal normal-case tracking-normal text-white shadow-lg group-hover/asterisk:block group-focus-within/asterisk:block"
      >
        {note}
      </span>
    </span>
  );
}

export function EnvelopeDescription({
  description,
  descriptionNote,
  className = "",
}: {
  description: string;
  descriptionNote?: string;
  className?: string;
}) {
  const parts = description.split("*");
  const hasInlineAsterisk = parts.length > 1;

  return (
    <p className={`whitespace-pre-line ${className}`}>
      {parts.map((part, index) => (
        <span key={index}>
          {part}
          {index < parts.length - 1 ? (
            descriptionNote ? (
              <DescriptionAsterisk note={descriptionNote} />
            ) : (
              "*"
            )
          ) : null}
        </span>
      ))}
      {!hasInlineAsterisk && descriptionNote ? (
        <DescriptionAsterisk note={descriptionNote} />
      ) : null}
    </p>
  );
}
