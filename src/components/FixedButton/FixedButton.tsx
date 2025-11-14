interface FixedButtonProps {
  isToggled: boolean;
  onToggle: () => void;
  leftLabel: string;
  rightLabel: string;
  position?: 'bottom-right' | 'bottom-left';
  offset?: number;
}

function FixedButton({
  isToggled,
  onToggle,
  leftLabel,
  rightLabel,
  position = 'bottom-right',
  offset = 0
}: FixedButtonProps) {
  const positionStyles = position === 'bottom-right'
    ? { bottom: `${4 + offset}rem`, right: '1rem' }
    : { bottom: `${4 + offset}rem`, left: '1rem' };

  return (
    <div
      className="fixed bg-white px-6 py-4 rounded-full shadow-lg z-50 border border-gray-200"
      style={positionStyles}
    >
      <div className="flex items-center gap-4">
        <span className={`text-lg font-bold ${!isToggled ? 'text-blue-600' : 'text-gray-400'}`}>
          {leftLabel}
        </span>
        <button
          onClick={onToggle}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isToggled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              isToggled ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-lg font-bold ${isToggled ? 'text-blue-600' : 'text-gray-400'}`}>
          {rightLabel}
        </span>
      </div>
    </div>
  );
}

export default FixedButton;
