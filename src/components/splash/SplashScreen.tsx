import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Text } from "react-native";
import { styles } from "./SplashScreen.styles";

export default function SplashScreen() {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace("/(auth)/sign-in");
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.title}>Devo Reflect</Text>
    </Animated.View>
  );
}
