import React, { useEffect } from 'react';
import { Character } from '../types/character';

interface DynamicFaviconProps {
  selectedCharacter: Character | null;
}

const DynamicFavicon: React.FC<DynamicFaviconProps> = ({ selectedCharacter }) => {
  // 创建圆形 canvas 并调整图片尺寸的函数
  const createCircularImage = (imageUrl: string, size: number = 32): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // 创建圆形裁剪路径
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        // 绘制图片
        ctx.drawImage(img, 0, 0, size, size);

        // 添加圆形边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        try {
          // 转换为 base64 格式的 PNG
          const circularImageUrl = canvas.toDataURL('image/png');
          resolve(circularImageUrl);
        } catch (error) {
          console.error('Error converting canvas to data URL:', error);
          reject(error);
        }
      };

      img.onerror = (error) => {
        console.error('Error loading image:', error);
        reject(error);
      };

      img.src = imageUrl;
    });
  };

  useEffect(() => {
    const updateFavicon = async () => {
      try {
        if (!selectedCharacter) {
          return;
        }

        // 使用当前选中角色的头像
        const avatarImage = selectedCharacter.avatarFile;
        
        // 创建圆形图标
        const circularImage = await createCircularImage(avatarImage, 32);

        // 创建或获取 favicon 元素
        let link: HTMLLinkElement = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }

        // 设置圆形图片作为 favicon
        link.type = 'image/png';
        link.href = circularImage;

      } catch (error) {
        console.error('Error updating favicon:', error);
      }
    };

    updateFavicon();

    // 清理函数
    return () => {
      const link = document.querySelector("link[rel~='icon']");
      if (link && link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [selectedCharacter]); // 依赖项改为 selectedCharacter

  return null;
};

export default DynamicFavicon; 