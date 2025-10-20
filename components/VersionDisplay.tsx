import packageJson from '../package.json';

interface VersionDisplayProps {
  className?: string;
  showPrefix?: boolean;
}

export function VersionDisplay({ 
  className = "text-xs text-gray-500", 
  showPrefix = true 
}: VersionDisplayProps) {
  return (
    <div className={className}>
      {showPrefix && "v"}
      {packageJson.version}
    </div>
  );
}

export default VersionDisplay;
