import React from 'react';

interface TimelineLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export const TimelineLogo: React.FC<TimelineLogoProps> = ({ 
  width = 90, 
  height = 90, 
  className = "" 
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 90 90" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <polygon 
        points="21.11,58.18 26.87,58.18 36.27,45 26.87,31.82 0,31.82 9.4,45 0,58.18 10.34,58.18" 
        fill="#f27070"
      />
      <polygon 
        points="47.06,31.82 53.73,31.82 63.13,45 53.73,58.18 26.87,58.18 36.27,45 26.87,31.82 37.04,31.82" 
        fill="#ffca55"
      />
      <polygon 
        points="73.88,58.18 80.6,58.18 90,45 80.6,31.82 53.73,31.82 63.13,45 53.73,58.18 63.35,58.18" 
        fill="#09d6b4"
      />
      <path 
        d="M 42.313 36.762 c -0.552 0 -1 -0.448 -1 -1 V 20.656 c 0 -0.552 0.448 -1 1 -1 s 1 0.448 1 1 v 15.106 C 43.313 36.314 42.866 36.762 42.313 36.762 z" 
        fill="#aaa"
      />
      <path 
        d="M 69.179 70.344 c -0.553 0 -1 -0.447 -1 -1 V 54.238 c 0 -0.553 0.447 -1 1 -1 s 1 0.447 1 1 v 15.105 C 70.179 69.896 69.731 70.344 69.179 70.344 z" 
        fill="#aaa"
      />
      <path 
        d="M 15.448 70.344 c -0.552 0 -1 -0.447 -1 -1 V 54.238 c 0 -0.553 0.448 -1 1 -1 s 1 0.447 1 1 v 15.105 C 16.448 69.896 16 70.344 15.448 70.344 z" 
        fill="#aaa"
      />
      <rect x="39.14" y="14.57" width="6.09" height="6.09" fill="#ffca55"/>
      <rect x="66.14" y="69.34" width="6.09" height="6.09" fill="#f27070"/>
      <rect x="12.4" y="69.34" width="6.09" height="6.09" fill="#f27070"/>
    </svg>
  );
};

export default TimelineLogo;
