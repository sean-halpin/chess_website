import React, { useState, useEffect } from 'react';

export interface TextProps {
  text: string;
}

export const TextComponent: React.FC<TextProps> = ({ text }) => {
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
    <div className='infoBox'>
      <p>{text}</p>
      <p>Timer: {timer} seconds</p>
    </div>
  );
};
