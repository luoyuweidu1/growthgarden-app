export interface TreeHealth {
  status: 'healthy' | 'warning' | 'withered';
  hoursUntilDeath: number;
  hoursUntilWarning: number;
  daysSinceWatered: number;
}

export function calculateTreeHealth(lastWatered: Date | string | null | undefined): TreeHealth {
  const now = new Date();
  
  // If no lastWatered date, assume it was watered recently for demo purposes
  if (!lastWatered) {
    const recentDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
    const hoursSinceWatered = 24;
    const daysSinceWatered = 1;
    
    return {
      status: 'healthy',
      hoursUntilDeath: 168 - hoursSinceWatered,
      hoursUntilWarning: 72 - hoursSinceWatered,
      daysSinceWatered,
    };
  }
  
  const lastWateredDate = typeof lastWatered === 'string' ? new Date(lastWatered) : lastWatered;
  
  // Check if the date is valid
  if (isNaN(lastWateredDate.getTime())) {
    // Invalid date, treat as recently watered
    const hoursSinceWatered = 24;
    const daysSinceWatered = 1;
    
    return {
      status: 'healthy',
      hoursUntilDeath: 168 - hoursSinceWatered,
      hoursUntilWarning: 72 - hoursSinceWatered,
      daysSinceWatered,
    };
  }
  
  const hoursSinceWatered = (now.getTime() - lastWateredDate.getTime()) / (1000 * 60 * 60);
  const daysSinceWatered = Math.floor(hoursSinceWatered / 24);
  
  const hoursUntilWarning = Math.max(0, 72 - hoursSinceWatered); // 3 days = 72 hours
  const hoursUntilDeath = Math.max(0, 168 - hoursSinceWatered); // 7 days = 168 hours
  
  let status: TreeHealth['status'] = 'healthy';
  
  if (hoursSinceWatered >= 168) {
    status = 'withered';
  } else if (hoursSinceWatered >= 72) {
    status = 'warning';
  }
  
  return {
    status,
    hoursUntilDeath,
    hoursUntilWarning,
    daysSinceWatered,
  };
}

export function getTreeHealthColor(health: TreeHealth): string {
  switch (health.status) {
    case 'withered':
      return 'text-red-500';
    case 'warning':
      return 'text-orange-500';
    default:
      return 'text-forest-500';
  }
}

export function getTreeHealthMessage(health: TreeHealth): string {
  switch (health.status) {
    case 'withered':
      return 'Tree has withered';
    case 'warning':
      return `Needs water in ${Math.ceil(health.hoursUntilDeath)} hours`;
    default:
      return 'Tree is healthy';
  }
}
