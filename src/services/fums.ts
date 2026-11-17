// API.Bible's Fair Use Management System (FUMS): API.Bible requires web apps
// to report each view of its copyrighted text, so publishers can count
// readers. Every chapter it sends comes with a token; showing the chapter
// reports that token through API.Bible's script. No account details are
// sent (we don't call fums("config", { userId })).
// https://docs.api.bible/resources/fair-use
//
// Web only: API.Bible doesn't require it in phone apps, and there's no page
// to load the script into there.

const FUMS_SCRIPT = "https://pkg.api.bible/fumsV3.min.js";

type FumsWindow = {
  fums?: (...args: unknown[]) => void;
  fumsData?: unknown[];
};

let scriptAdded = false;

/** Reports that a chapter with this FUMS token is being shown. */
export function reportFumsView(token: string | undefined): void {
  if (!token || typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  const w = window as unknown as FumsWindow;
  if (!scriptAdded) {
    scriptAdded = true;
    // Queue calls until the script has loaded (API.Bible's documented stub)
    w.fumsData = w.fumsData || [];
    w.fums =
      w.fums ||
      function () {
        w.fumsData!.push(arguments);
      };
    const script = document.createElement("script");
    script.src = FUMS_SCRIPT;
    script.async = true;
    document.head.appendChild(script);
  }
  w.fums!("trackView", token);
}
