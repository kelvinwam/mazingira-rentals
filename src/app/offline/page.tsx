export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6">
        <span className="text-3xl">📡</span>
      </div>
      <h1 className="font-display font-extrabold text-2xl text-white mb-3">You're offline</h1>
      <p className="text-navy-400 text-sm max-w-sm mb-8">
        No internet connection. Previously visited pages are still available — try going back or check your connection.
      </p>
      <button onClick={() => window.location.reload()}
        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold font-display rounded-xl transition-colors">
        Try Again
      </button>
    </div>
  );
}
