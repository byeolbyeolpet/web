import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 조건부 클래스명을 병합한다. clsx로 조합하고 tailwind-merge로
 * 충돌하는 Tailwind 유틸리티(예: px-2 vs px-4)를 뒤엣것 우선으로 정리한다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
