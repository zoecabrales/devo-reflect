import { Text, View, StyleSheet } from "react-native";

export default function Prayers() {
  return (
    <View style={styles.container}>
      <Text>Prayers</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

