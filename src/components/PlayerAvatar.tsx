import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PlayerAvatarProps {
  name: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showName?: boolean;
}

export default function PlayerAvatar({
  name,
  imageUrl,
  size = "md",
  className,
  showName = false
}: PlayerAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-base",
    xl: "h-24 w-24 text-lg"
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Avatar className={cn(sizeClasses[size], "ring-2 ring-background shadow-md")}>
        <AvatarImage src={imageUrl} alt={name} className="object-cover" />
        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <span className="font-medium">{name}</span>
      )}
    </div>
  );
}
