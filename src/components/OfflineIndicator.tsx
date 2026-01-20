import { useOffline } from '../context/OfflineContext'

export default function OfflineIndicator() {
  const { isOnline, isOfflineReady, needsRefresh, updateServiceWorker } = useOffline()

  // Show nothing if online and no updates needed
  if (isOnline && !needsRefresh) {
    return null
  }

  return (
    <>
      {/* Offline banner */}
      {!isOnline && (
        <div className="offline-banner">
          <span className="offline-icon">📴</span>
          <span className="offline-text">
            {isOfflineReady ? 'Offline - App still works!' : 'No internet connection'}
          </span>
        </div>
      )}

      {/* Update available banner */}
      {needsRefresh && (
        <div className="update-banner">
          <span className="update-text">New version available!</span>
          <button className="update-btn" onClick={updateServiceWorker}>
            Update
          </button>
        </div>
      )}
    </>
  )
}
