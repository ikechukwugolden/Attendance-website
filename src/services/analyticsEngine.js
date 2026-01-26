export const detectPatterns = (logs) => {
  if (!logs || logs.length === 0) return [];

  const patterns = [];
  const userStats = {};

  // 1. Grouping, Counting, and Streak Tracking
  // Note: logs must be sorted by timestamp (descending) for streaks to work
  const sortedLogs = [...logs].sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());

  sortedLogs.forEach((log) => {
    if (!log.userId) return;
    
    const uid = log.userId;
    const dateObj = log.timestamp.toDate();
    const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

    if (!userStats[uid]) {
      userStats[uid] = {
        name: log.userName,
        totalLogs: 0,
        lateCount: 0,
        dayFrequency: {},
        recentHistory: [] // Stores last few status results for streak detection
      };
    }

    userStats[uid].totalLogs += 1;
    userStats[uid].recentHistory.push(log.status);

    if (log.status === "Late") {
      userStats[uid].lateCount += 1;
      userStats[uid].dayFrequency[day] = (userStats[uid].dayFrequency[day] || 0) + 1;
    }
  });

  // 2. Intelligence Analysis
  Object.values(userStats).forEach(stat => {
    const latePercentage = (stat.lateCount / stat.totalLogs) * 100;

    // 🟢 NEW RULE: The Immediate Streak (2 Lates in a row)
    // Triggers instantly if the last two scans were late
    const lastTwo = stat.recentHistory.slice(0, 2);
    if (lastTwo.length === 2 && lastTwo.every(status => status === "Late")) {
      patterns.push({
        userName: stat.name,
        issue: `Critical Streak: 2+ consecutive late arrivals.`,
        severity: "High",
        type: "streak"
      });
    }

    // RULE 1: Chronic Lateness (Frequency)
    if (latePercentage > 40 && stat.totalLogs >= 3) { // Lowered to 3 logs for faster alert
      patterns.push({
        userName: stat.name,
        issue: `Chronic Issue: Late for ${latePercentage.toFixed(0)}% of total shifts.`,
        severity: "High",
        type: "frequency"
      });
    }

    // RULE 2: Specific Day Patterns (e.g., "Monday Blues")
    Object.entries(stat.dayFrequency).forEach(([day, count]) => {
      if (count >= 2) { // Lowered to 2 for more sensitive detection
        patterns.push({
          userName: stat.name,
          issue: `Recurring ${day} Delay: Pattern detected on ${day} mornings.`,
          severity: "Medium",
          type: "day_specific"
        });
      }
    });
  });

  return patterns;
};