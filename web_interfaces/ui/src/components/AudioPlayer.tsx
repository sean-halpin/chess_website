import React, { RefObject } from "react";

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
      <div>
        <audio ref={this.audioRef} controls hidden>
          <source
            src={`${process.env.PUBLIC_URL  }/sounds/table_knock.wav`}
            type="audio/wav"
          />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }
}

export default AudioPlayer;
