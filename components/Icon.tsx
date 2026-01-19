
import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconProps {
  name: keyof typeof LucideIcons;
  className?: string;
  size?: number;
}

const Icon: React.FC<IconProps> = ({ name, className = "", size = 20 }) => {
  const LucideIcon = LucideIcons[name] as any;
  if (!LucideIcon) return null;
  return <LucideIcon className={className} size={size} />;
};

export default Icon;
