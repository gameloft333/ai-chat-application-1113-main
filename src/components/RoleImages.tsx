import React from 'react';

interface RoleImagesProps {
  role: string;
}

const RoleImages: React.FC<RoleImagesProps> = ({ role }) => {
  // 这里我们使用占位图片，实际应用中需要替换为真实的角色图片
  const placeholderImages = [
    'https://img01.sc115.com/uploads3/sc/jpgs/2211/241e4392925ef87e_sc115.com.jpg'
    'https://scpic.chinaz.net/files/default/imgs/2024-01-03/d46d05a6e91c6a8c.jpg'
    'https://img01.sc115.com/uploads3/sc/jpgs/2308/d4b4138eced38ff6_sc115.com.jpg'
    'https://aioss.ii.cn/upload/imgb/20240909/66de4762333d2pqcSHljx.png'
    `https://via.placeholder.com/150?text=${role}1`,
    `https://via.placeholder.com/150?text=${role}2`,
    `https://via.placeholder.com/150?text=${role}3`,
  ];

  return (
    <div className="flex justify-around">
      {placeholderImages.map((src, index) => (
        <img
          key={index}
          src={src}
          alt={`${role} ${index + 1}`}
          className="w-1/4 rounded-lg"
          style={{ aspectRatio: '9 / 16', objectFit: 'cover' }} // 设置宽高比为 9:16，并使用 cover
        />
      ))}
    </div>
  );
};

export default RoleImages;
