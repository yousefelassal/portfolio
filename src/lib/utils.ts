import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (date: Date) =>
  Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

export const readingTime = (html: string) => {
  const textOnly = html.replaceAll(/<[^>]+>/gu, "");
  const wordCount = textOnly.split(/\s+/u).length;
  const readingTimeMinutes = (wordCount / 200 + 1).toFixed(0);
  return `${readingTimeMinutes} min read`;
};
