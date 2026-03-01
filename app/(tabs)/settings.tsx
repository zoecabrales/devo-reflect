import { signOutUser } from "@/src/services/auth";
import { useRouter } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import { styles } from "./settings.styles";

export default function Settings() {
  const router = useRouter();

  async function handleSignOut() {
    try {
      await signOutUser();
      router.replace("/(auth)/sign-in");
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Could not sign out.");
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => router.push("/(auth)/change-password")}
        style={styles.outlineButton}
      >
        <Text style={styles.outlineButtonText}>Change Password</Text>
      </Pressable>

      <Pressable onPress={handleSignOut} style={styles.button}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/(auth)/delete-account")}>
        <Text style={styles.deleteLink}>Delete Account</Text>
      </Pressable>
    </View>
  );
}
