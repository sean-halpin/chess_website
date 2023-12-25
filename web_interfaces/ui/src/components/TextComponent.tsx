import React, { useState, useEffect } from "react";
import "./TextComponent.css";

export interface TextProps {
  text: string;
  textLow: string;
}

export const TextComponent: React.FC<TextProps> = ({ text, textLow }) => {
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
    <div>
      <div className="infoBox">
        <p>{text}</p>
        <p>Timer: {timer} seconds</p>
      </div>
      <div className="text-component-container">
        <input type="text" id="textInput" name="textInput" value={textLow}></input>
      </div>
    </div>
  );
};
