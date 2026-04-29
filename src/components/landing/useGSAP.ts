import { useEffect, type DependencyList } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useGSAP(fn: () => void, deps: DependencyList = []) {
  useEffect(() => {
    const ctx = gsap.context(fn);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export { ScrollTrigger };
