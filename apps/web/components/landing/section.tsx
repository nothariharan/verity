import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "left",
  id,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  align?: "left" | "center";
  id?: string;
  className?: string;
}) {
  return (
    <Reveal className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
      <h2 id={id} className="headline text-balance text-[clamp(36px,5vw,64px)] text-ink">
        {title}
      </h2>
      {body && (
        <p className={cn("mt-6 max-w-xl text-pretty text-[17px] leading-relaxed text-muted md:text-[19px]", align === "center" && "mx-auto")}>
          {body}
        </p>
      )}
    </Reveal>
  );
}

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>{children}</div>;
}
