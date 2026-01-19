export const detectPatterns = (logs) => {
  const patterns = [];
  const userStats = {};

  // Grouping "Late" logs by user and day
  logs.forEach(log => {
    if (log.status === "Late") {
      const day = new Date(log.timestamp.toDate()).toLocaleDateString('en-US', { weekday: 'long' });
      const key = `${log.user_id}_${day}`;
      userStats[key] = (userStats[key] || 0) + 1;
      
      // If a user is late on the same day 3+ times, flag it
      if (userStats[key] === 3) {
        patterns.push({
          userName: log.userName,
          issue: `Chronic lateness detected on ${day}s.`,
          severity: "High"
        });
      }
    }
  });
  return patterns;
};