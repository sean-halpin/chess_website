import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Game} from './src/components/Game';
import {DraxProvider} from 'react-native-drax';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

export default function App(): React.JSX.Element {
  return (
    // eslint-disable-next-line react-native/no-inline-styles
    <GestureHandlerRootView style={{flex: 1}}>
      <View style={styles.container} testID="game_view">
        <DraxProvider>
          <Game />
        </DraxProvider>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
