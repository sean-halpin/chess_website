export interface TextProps {
  text: string;
}

export const TextComponent: React.FC<TextProps> = ({ text }) => {
  return <div><h3>{text}</h3></div>;
};
