import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'info', duration = 3000, position = 'bottom-right', onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const bgColor = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }[type];

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2',
    'center': 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2',
  }[position] || 'fixed bottom-4 right-4';

  return (
    <div className={`${positionClasses} ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse`}>
      {message}
    </div>
  );
};

export default Toast;
