import { useState } from 'react';

export function useDiscover() {
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<any[]>([]);

  // The handleDiscover function is passed as a prop, but wait, it is defined in App.tsx!
  // I should just extract the state for now, and I'll keep the functions that are deeply tied to token/fetchWithAuth in App.tsx if I don't want to extract them here, or I can extract them.
  // Let's just return the state for now.
  
  return {
    discoverQuery, setDiscoverQuery,
    isDiscovering, setIsDiscovering,
    discoveryResults, setDiscoveryResults
  };
}
