import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

export interface TextProps {
  statusMessage: string;
  nextToMove: string;
  fenString: string;
}

export const TextComponent: React.FC<TextProps> = ({ statusMessage, nextToMove, fenString }) => {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimer((prevTimer) => prevTimer + 1);
    }, 1000); // Update every 1000 milliseconds (1 second)
    return () => {
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array ensures the effect runs only once after initial render

  return (
    <View>
      <View style={styles.infoBox}>
        <Text>{statusMessage}</Text>
        <Text>{nextToMove}</Text>
        <Text>Timer: {timer} seconds</Text>
      </View>
      <View style={styles.textComponentContainer}>
        <TextInput
          style={styles.input}
          placeholder=""
          value={fenString}
          onChangeText={() => undefined}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  infoBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  textComponentContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  input: {
    width: "90%",
    maxWidth: 500,
    padding: 8,
    borderWidth: 1,
    borderColor: "black", // Add your desired border color
    borderRadius: 5,
    marginBottom: 10,
  },
});
