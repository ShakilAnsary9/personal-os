'use client';

interface SparklineProps {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({
  values,
  color = 'var(--pine)',
  width = 120,
  height = 34,
}: SparklineProps) {
  const pad = 3;
  if (!values.length) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
      />
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const pts = values.map((v, i) => [
    pad + i * step,
    height - pad - ((v - min) / range) * (height - pad * 2),
  ]);
  const d = pts
    .map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(' ');
  const area =
    d +
    ` L${pts[pts.length - 1][0].toFixed(1)} ${height - pad} L${pad} ${height - pad} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
    >
      <path d={area} fill={color} opacity=".13" />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={last[0].toFixed(1)}
        cy={last[1].toFixed(1)}
        r="2.4"
        fill={color}
        stroke="#FAF7EC"
        strokeWidth="1"
      />
    </svg>
  );
}
