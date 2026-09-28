import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X } from 'lucide-react';
import { removeNotification } from '../../store/slices/uiSlice.js';

const COLORS = {
  red:    'border-red-500 bg-red-950/80 text-red-100',
  yellow: 'border-amber-500 bg-amber-950/80 text-amber-100',
  green:  'border-emerald-500 bg-emerald-950/80 text-emerald-100',
  info:   'border-cyan-500 bg-cyan-950/80 text-cyan-100',
};

const Toast = ({ note }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const t = setTimeout(() => dispatch(removeNotification(note.id)), 6000);
    return () => clearTimeout(t);
  }, [note.id, dispatch]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-md shadow-xl animate-slide-in max-w-sm ${COLORS[note.type] || COLORS.info}`}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{note.title}</p>
        <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{note.message}</p>
        {note.station && (
          <p className="text-xs opacity-60 mt-1 capitalize">📍 {note.station} station</p>
        )}
      </div>
      <button
        onClick={() => dispatch(removeNotification(note.id))}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  );
};

const NotificationToast = () => {
  const notifications = useSelector((s) => s.ui.notifications);
  if (!notifications.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((note) => (
        <div key={note.id} className="pointer-events-auto">
          <Toast note={note} />
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
