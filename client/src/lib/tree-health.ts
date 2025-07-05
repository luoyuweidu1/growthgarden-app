export interface TreeHealth {
  status: 'healthy' | 'warning' | 'withered';
  hoursUntilDeath: number;
  hoursUntilWarning: number;
  daysSinceWatered: number;
}

export function calculateTreeHealth(lastWatered: Date): TreeHealth {
  const now = new Date();
  const hoursSinceWatered = (now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60);
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
