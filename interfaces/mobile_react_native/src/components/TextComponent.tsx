import React, {useState, useEffect} from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';

export interface TextProps {
  statusMessage: string;
  nextToMove: string;
  fenString: string;
}

export const TextComponent: React.FC<TextProps> = ({
  statusMessage,
  nextToMove,
  fenString,
}) => {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimer(prevTimer => prevTimer + 1);
    }, 1000); // Update every 1000 milliseconds (1 second)
    return () => {
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array ensures the effect runs only once after initial render

  return (
    <View>
      <View style={styles.infoBox}>
        <Text style={styles.text}>{statusMessage}</Text>
        <Text style={styles.text}>{nextToMove}</Text>
        <Text style={styles.text}>Timer: {timer} seconds</Text>
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
    alignItems: 'center',
    textAlign: 'center',
    padding: 10,
  },
  textComponentContainer: {
    alignItems: 'center',
    color: 'white',
  },
  text: {
    color: 'white',
  },
  input: {
    color: 'white',
    width: '95%',
    maxWidth: 500,
    padding: 8,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
});
