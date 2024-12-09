export const generateRandomColor = () => {
  // 使用 HSL 颜色空间以便更好地控制亮度和饱和度
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.random() * 20; // 70-90%
  const lightness = 45 + Math.random() * 10;  // 45-55%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}; 