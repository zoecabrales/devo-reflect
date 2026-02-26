import { Text, View, StyleSheet } from "react-native";

export default function Journal() {
  return (
    <View style={styles.container}>
      <Text>Journal</Text>
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

