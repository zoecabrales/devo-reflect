import { auth } from "@/src/services/firebase";
import { useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useRef } from "react";
import { Animated, Text } from "react-native";
import { styles } from "./SplashScreen.styles";

export default function SplashScreen() {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const authStatePromise = new Promise<User | null>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });

    const animationPromise = new Promise<void>((resolve) => {
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
      ]).start(() => resolve());
    });

    Promise.all([animationPromise, authStatePromise]).then(([, user]) => {
      if (!user) {
        router.replace("/(auth)/sign-in");
      } else if (!user.emailVerified) {
        router.replace("/(auth)/verify-email");
      } else {
        router.replace("/(tabs)/home");
      }
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.title}>Devo Reflect</Text>
    </Animated.View>
  );
}
