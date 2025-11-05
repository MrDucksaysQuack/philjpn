"use client";

import {
  BuildingIcon,
  UsersIcon,
  RocketIcon,
  TargetIcon,
  EyeIcon,
  HeartIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CheckIcon,
} from "./icons";

// 아이콘 이름 문자열을 실제 컴포넌트로 매핑
export function getIconComponent(iconName?: string, className = "w-8 h-8") {
  if (!iconName) return null;

  const iconMap: Record<string, React.ReactNode> = {
    BuildingIcon: <BuildingIcon className={className} />,
    UsersIcon: <UsersIcon className={className} />,
    RocketIcon: <RocketIcon className={className} />,
    TargetIcon: <TargetIcon className={className} />,
    EyeIcon: <EyeIcon className={className} />,
    HeartIcon: <HeartIcon className={className} />,
    MailIcon: <MailIcon className={className} />,
    PhoneIcon: <PhoneIcon className={className} />,
    MapPinIcon: <MapPinIcon className={className} />,
    CheckIcon: <CheckIcon className={className} />,
  };

  return iconMap[iconName] || null;
}

