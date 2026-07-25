import React from "react";
import * as LucideIcons from "lucide-react";

interface DynamicIconProps extends Omit<LucideIcons.LucideProps, 'ref'> {
  name: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  // Convert name from "kebab-case" to "PascalCase"
  const pascalName = name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  
  const IconComponent = (LucideIcons as any)[pascalName];
  if (!IconComponent) {
    return <LucideIcons.Circle {...props} />;
  }

  return <IconComponent {...props} />;
};
