export const IconPlaceholder = () => {
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      
    >
      {/* Square background */}
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        rx="8"
        fill="#E5E7EB"
        stroke="#9CA3AF"
        strokeWidth="2"
      />
      {/* Circle in the middle */}
      <circle
        cx="50"
        cy="50"
        r="25"
        fill="#9CA3AF"
        stroke="#4B5563"
        strokeWidth="2"
      />
    </svg>
  );
};

export default IconPlaceholder;
