import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Game } from "./src/components/Game";
import { DraxProvider } from "react-native-drax";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex:1}} >
      <View style={styles.container} testID="game_view">
        <DraxProvider>
          <Game />
        </DraxProvider>
        <StatusBar style="auto" />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
});
