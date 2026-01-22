export const detectPatterns = (logs) => {
  const patterns = [];
  const userStats = {};

  // 1. Grouping and Counting
  logs.forEach(log => {
    if (!log.userId) return; // Support for the updated userId field
    
    const uid = log.userId;
    const day = new Date(log.timestamp.toDate()).toLocaleDateString('en-US', { weekday: 'long' });

    if (!userStats[uid]) {
      userStats[uid] = {
        name: log.userName,
        totalLogs: 0,
        lateCount: 0,
        dayFrequency: {}, // Tracks which specific days they are late
      };
    }

    userStats[uid].totalLogs += 1;

    if (log.status === "Late") {
      userStats[uid].lateCount += 1;
      userStats[uid].dayFrequency[day] = (userStats[uid].dayFrequency[day] || 0) + 1;
    }
  });

  // 2. Pattern Analysis
  Object.values(userStats).forEach(stat => {
    const latePercentage = (stat.lateCount / stat.totalLogs) * 100;

    // RULE 1: Chronic Lateness (General)
    if (latePercentage > 40 && stat.totalLogs >= 5) {
      patterns.push({
        userName: stat.name,
        issue: `Chronic Punctuality Issue: Late for ${latePercentage.toFixed(0)}% of shifts.`,
        severity: "High",
        type: "frequency"
      });
    }

    // RULE 2: Specific Day Patterns (e.g., "Monday Blues")
    Object.entries(stat.dayFrequency).forEach(([day, count]) => {
      if (count >= 3) {
        patterns.push({
          userName: stat.name,
          issue: `Recurring ${day} Delay: Late on ${count} consecutive ${day}s.`,
          severity: "Medium",
          type: "day_specific"
        });
      }
    });
  });

  return patterns;
};