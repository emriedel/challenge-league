// Utility function to trigger league actions refresh
export function refreshLeagueActions() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('refreshLeagueActions'));
  }
}