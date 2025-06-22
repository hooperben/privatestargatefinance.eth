interface ErrorDisplayProps {
  error: string;
  technicalError: string | null;
  showTechnicalDetails: boolean;
  onToggleTechnicalDetails: () => void;
  onClearError: () => void;
}

export function ErrorDisplay({
  error,
  technicalError,
  showTechnicalDetails,
  onToggleTechnicalDetails,
  onClearError,
}: ErrorDisplayProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="text-red-500 text-lg">⚠️</div>
        <div className="flex-1">
          <p className="text-red-800 font-medium text-sm mb-1">{error}</p>

          {technicalError && (
            <div className="mt-2">
              <button
                onClick={onToggleTechnicalDetails}
                className="text-xs text-red-600 hover:text-red-700 underline focus:outline-none"
              >
                {showTechnicalDetails ? "Hide" : "Show"} technical details
              </button>

              {showTechnicalDetails && (
                <div className="mt-2 p-3 bg-red-100 rounded border border-red-300">
                  <p className="text-xs text-red-700 font-mono break-all">
                    {technicalError}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onClearError}
          className="text-red-400 hover:text-red-600 focus:outline-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
