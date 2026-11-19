/** The Trace mark: a T drawn as a device graph. Two browsers meet at one bar; the stem breaks where storage is cleared and lands on the same node anyway. */
export function Mark({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={color}>
      <circle cx="4" cy="5" r="3" />
      <circle cx="20" cy="5" r="3" />
      <rect x="4" y="3.75" width="16" height="2.5" />
      <rect x="10.75" y="5" width="2.5" height="7.5" />
      <circle cx="12" cy="19" r="3" />
    </svg>
  );
}

export function Lockup({ size = 20 }: { size?: number }) {
  return (
    <>
      <Mark size={size} />
      <b>trace</b>
    </>
  );
}
