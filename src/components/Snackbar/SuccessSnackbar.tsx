import { useEffect } from 'react';

interface SuccessSnackbarProps {
  message: string;
  duration?: number; // 밀리초, 기본값 3000ms
  onClose?: () => void;
}

export default function SuccessSnackbar({ message, duration = 3000, onClose }: SuccessSnackbarProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
}
