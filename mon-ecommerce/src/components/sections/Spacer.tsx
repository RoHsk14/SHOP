"use client";

interface Props {
  settings: {
    height?: number;
    mobile_height?: number;
  };
}

export default function Spacer({ settings }: Props) {
  const height = settings.height ?? 60;
  const mobileHeight = settings.mobile_height ?? 40;
  return (
    <div
      className="w-full"
      style={{ height: mobileHeight }}
      data-desktop-height={height}
    >
      <style>{`
        @media (min-width: 640px) {
          [data-desktop-height="${height}"] { height: ${height}px !important; }
        }
      `}</style>
    </div>
  );
}
