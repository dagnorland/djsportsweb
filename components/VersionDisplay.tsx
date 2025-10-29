"use client";

import { useState } from 'react';
import packageJson from '../package.json';
import { UserGuideDialog } from './UserGuideDialog';

interface VersionDisplayProps {
  className?: string;
  showPrefix?: boolean;
}

export function VersionDisplay({
  className = "text-xs text-gray-500",
  showPrefix = true
}: VersionDisplayProps) {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <>
      <div
        className={`${className} cursor-pointer hover:text-primary transition-colors`}
        onClick={() => setShowGuide(true)}
        title="Klikk for brukerveiledning / Click for user guide"
      >
        {showPrefix && "v"}
        {packageJson.version}
      </div>
      <UserGuideDialog open={showGuide} onOpenChange={setShowGuide} />
    </>
  );
}

export default VersionDisplay;
