"use client";
import { AlertTriangle, Trash2, Sparkles } from "lucide-react";

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
  onDownloadBackup?: () => void;
};

export default function ResetConfirmModal({ onConfirm, onCancel, onDownloadBackup }: Props) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-5">
          <AlertTriangle className="w-8 h-8 text-purple-500" strokeWidth={1.8} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Fresh?</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-1">
          This will clear all your logged hours, settings, and progress.
        </p>
        <p className="text-purple-600 font-semibold text-sm mb-6">
          This action cannot be undone!
        </p>

        {/* Backup tip */}
        <button
          onClick={onDownloadBackup}
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-center gap-2 text-purple-600 font-semibold text-sm hover:bg-purple-50 transition mb-6"
        >
          <Sparkles className="w-4 h-4" />
          Tip: Download a backup first!
        </button>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition">
            Keep Data
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-purple-200">
            <Trash2 className="w-4 h-4" />
            Reset All
          </button>
        </div>
      </div>
    </div>
  );
}