import React, { RefObject } from "react";
import { View, Text } from "react-native";

type AudioPlayerProps = object;

type AudioPlayerState = object;

class AudioPlayer extends React.Component<AudioPlayerProps, AudioPlayerState> {
  audioRef: RefObject<HTMLAudioElement>;

  constructor(props: AudioPlayerProps) {
    super(props);
    this.audioRef = React.createRef();
  }

  play = () => {
    if (this.audioRef.current) {
      console.log("[AudioPlayer] Play audio.");
      this.audioRef.current.play();
    }
  };

  render() {
    return (
      <View>
        <Text>Your device does not support audio playback.</Text>
      </View>
    );
  }
}

export default AudioPlayer;
