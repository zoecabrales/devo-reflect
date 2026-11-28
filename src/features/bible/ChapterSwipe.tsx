import { isChapterSwipe, isZoomedIn } from "@/src/utils/swipe";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  useWindowDimensions,
  ViewStyle,
} from "react-native";

const useNativeDriver = Platform.OS !== "web";

type Props = {
  /** Off while selecting verses, so a stray swipe can't drop the selection. */
  enabled: boolean;
  /** Swipe left: next chapter (undefined at the end, the page just resists). */
  onNext?: () => void;
  /** Swipe right: previous chapter. */
  onPrev?: () => void;
  children: ReactNode;
};

/**
 * Phones and tablets: swipe left / right across the chapter to turn to the
 * next / previous one. The text follows the finger; vertical scrolling and
 * pinch zoom are left alone. Built on PanResponder so it works on iOS,
 * Android and mobile web without a gesture-handler root.
 */
export function ChapterSwipe({ enabled, onNext, onPrev, children }: Props) {
  const { width } = useWindowDimensions();
  const zoomed = usePageZoomed();

  // The responder is created once; its handlers read the latest props
  // through a ref, kept current after each render
  const latest = useRef({ enabled, onNext, onPrev, width, zoomed });
  useEffect(() => {
    latest.current = { enabled, onNext, onPrev, width, zoomed };
  });

  // The handlers read `latest` only while a drag is under way, never during
  // render; the rule can't tell callbacks given to PanResponder apart
  // eslint-disable-next-line react-hooks/refs
  const [{ x, responder }] = useState(() => {
    const x = new Animated.Value(0);
    const settle = () =>
      Animated.spring(x, {
        toValue: 0,
        useNativeDriver,
        bounciness: 0,
        speed: 20,
      }).start();

    const responder = PanResponder.create({
      // Claim clearly horizontal drags only, before the ScrollView or a
      // verse's tap handler does; anything else stays a scroll or a tap
      onMoveShouldSetPanResponderCapture: (_, g) =>
        latest.current.enabled &&
        isChapterSwipe({
          dx: g.dx,
          dy: g.dy,
          touches: g.numberActiveTouches,
          zoomed: latest.current.zoomed,
        }),
      onPanResponderMove: (_, g) => {
        const { onNext, onPrev } = latest.current;
        const can = g.dx < 0 ? onNext : onPrev;
        // No chapter that way: the page only gives a little
        x.setValue(can ? g.dx : g.dx * 0.2);
      },
      onPanResponderRelease: (_, g) => {
        const { onNext, onPrev, width } = latest.current;
        const forward = g.dx < 0;
        const go = forward ? onNext : onPrev;
        const far =
          Math.abs(g.dx) > Math.min(120, width * 0.25) ||
          (Math.abs(g.vx) > 0.5 && Math.abs(g.dx) > 40);
        if (!go || !far) return settle();
        Animated.timing(x, {
          toValue: forward ? -width : width,
          duration: 150,
          useNativeDriver,
        }).start(() => {
          go();
          // The new chapter slides in from the side it was swiped from
          x.setValue(forward ? 48 : -48);
          Animated.timing(x, {
            toValue: 0,
            duration: 180,
            useNativeDriver,
          }).start();
        });
      },
      onPanResponderTerminate: settle,
    });
    return { x, responder };
  });

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        styles.fill,
        !zoomed && webTouchAction,
        { transform: [{ translateX: x }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Mobile web: whether the page is pinch zoomed in. Always false elsewhere. */
function usePageZoomed(): boolean {
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const view = window.visualViewport;
    if (!view) return;
    const update = () => setZoomed(isZoomedIn(view.scale));
    update();
    view.addEventListener("resize", update);
    return () => view.removeEventListener("resize", update);
  }, []);
  return zoomed;
}

// Mobile web: the browser keeps vertical scrolling and pinch zoom and leaves
// horizontal drags to the app. Once zoomed in, the browser takes those too.
// (`touchAction` is web-only, so not in ViewStyle's type)
const webTouchAction = (
  Platform.OS === "web" ? { touchAction: "pan-y pinch-zoom" } : null
) as ViewStyle | null;

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
