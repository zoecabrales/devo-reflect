import {
  DESKTOP_CONTENT_ZOOM,
  MODAL_MAX_WIDTH,
  useIsDesktop,
} from "@/src/utils/responsive";
import { ReactNode } from "react";
import {
  Modal,
  ScrollView,
  StyleProp,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Mobile animation; desktop always fades. */
  animationType?: "fade" | "slide";
  statusBarTranslucent?: boolean;
  /** Mobile overlay (positions the card / sheet). Ignored on desktop. */
  overlayStyle: StyleProp<ViewStyle>;
  /** The card / sheet style, including theme colours. */
  cardStyle: StyleProp<ViewStyle>;
  /**
   * Mobile only: also close when the card itself is pressed (used by
   * transient toasts). Desktop never closes on a card press.
   */
  closeOnCardPress?: boolean;
  children: ReactNode;
};

/**
 * Shared modal shell.
 * - Mobile / tablet / narrow web: renders the screen's own overlay + card
 *   exactly as before (bottom sheets, centred cards, toasts).
 * - Desktop web: a centred, rounded, scrollable box over a dimmed backdrop,
 *   scaled like the rest of the desktop content.
 */
export function AppModal({
  visible,
  onClose,
  animationType = "fade",
  statusBarTranslucent,
  overlayStyle,
  cardStyle,
  closeOnCardPress = false,
  children,
}: Props) {
  const isDesktop = useIsDesktop();
  const { height } = useWindowDimensions();

  if (!isDesktop) {
    const card = <View style={cardStyle}>{children}</View>;
    return (
      <Modal
        visible={visible}
        transparent
        animationType={animationType}
        statusBarTranslucent={statusBarTranslucent}
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={overlayStyle}>
            {closeOnCardPress ? (
              card
            ) : (
              <TouchableWithoutFeedback>{card}</TouchableWithoutFeedback>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }

  // Keep the card's colours, but let the desktop frame own its shape/size.
  const { backgroundColor, borderColor } = StyleSheet.flatten(cardStyle) ?? {};

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={desktop.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                desktop.frame,
                {
                  backgroundColor,
                  borderColor,
                  // zoom shrinks the box, so divide to keep it within 85% of the window
                  maxHeight: (height * 0.85) / DESKTOP_CONTENT_ZOOM,
                  zoom: DESKTOP_CONTENT_ZOOM,
                } as ViewStyle,
              ]}
            >
              <ScrollView
                contentContainerStyle={[cardStyle, desktop.resetCard]}
                showsVerticalScrollIndicator
              >
                {children}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

/** Drag handle for bottom sheets; not shown in the desktop box. */
export function SheetHandle({ style }: { style: StyleProp<ViewStyle> }) {
  const isDesktop = useIsDesktop();
  return isDesktop ? null : <View style={style} />;
}

const desktop = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  frame: {
    width: "100%",
    maxWidth: MODAL_MAX_WIDTH + 40,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  // Undo sheet/toast framing from the mobile card style; keep its padding,
  // gap and direction so the content lays out the same.
  resetCard: {
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    maxHeight: undefined,
    margin: 0,
    borderWidth: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
    // Sheets use a short top / tall bottom padding around the handle
    paddingTop: 24,
    paddingBottom: 24,
  },
});
