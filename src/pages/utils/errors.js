// Errors rejected by api/client.js are Error instances with an optional
// `.status` property. This helper extracts a safe display string regardless
// of whether the error is an Error, a plain string (legacy/defensive), or
// something unexpected.
export function errMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message || fallback
  return fallback
}

export function errStatus(err) {
  if (err && typeof err === 'object' && 'status' in err) return err.status
  return null
}
