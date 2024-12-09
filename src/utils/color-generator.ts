/**
 * 生成随机颜色并确保与背景色有足够对比度
 */
export const generateRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.random() * 20; // 70-90%
  const lightness = 45 + Math.random() * 10;  // 45-55%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * 检查颜色是否与背景色相似
 */
export const isColorSimilarToBackground = (color: string, backgroundColor: string = '#1a202c') => {
  // 将 HSL 转换为 RGB 值并计算对比度
  const getRelativeLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r/255, g/255, b/255].map(c => 
      c <= 0.03928 ? c/12.92 : Math.pow((c + 0.055)/1.055, 2.4)
    );
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  // 计算对比度
  const contrastRatio = (l1: number, l2: number) => {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  };
  
  return contrastRatio(
    getRelativeLuminance(/* color RGB */), 
    getRelativeLuminance(/* backgroundColor RGB */)
  ) < 4.5;
}; 