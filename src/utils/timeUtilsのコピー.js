  } catch (error) {
    console.error('スケジュールキー検証エラー:', error, { achievementKey });
    return false;
  }
};

export const calculateMonthStudyHours = (weeklySchedules, achievements = {}, includeAchievementsInStats = false) => {
  if (!weeklySchedules || !Array.isArray(weeklySchedules) || !weeklySchedules.length) return 0;
  
  let totalMonthHours = 0;
  
  try {
    for (const weekSchedule of weeklySchedules) {
      if (weekSchedule) {
        totalMonthHours += calculateWeekStudyHours(
          weekSchedule, 
          achievements, 
          includeAchievementsInStats
        );
      }
    }
  } catch (error) {
    dateLogger.error('月間学習時間計算中にエラーが発生しました:', error);
  }
  
  return Math.round(totalMonthHours * 10) / 10;
};

export const debugAchievementStructure = (allAchievements) => {
  const debugResult = {
    totalDateKeys: Object.keys(allAchievements).length,
    achievementDetails: {},
    statusDistribution: {
      completed: 0,
      partial: 0,
      failed: 0,
      other: 0
    }
  };

  for (const dateKey in allAchievements) {
    const achievements = allAchievements[dateKey];
    
    if (typeof achievements !== 'object' || achievements === null) continue;

    const dateDetails = {
      totalAchievements: 0,
      achievementKeys: []
    };

    for (const achievementKey in achievements) {
      // updatedAtなどのシステム情報を除外
      if (achievementKey === 'updatedAt') continue;

      const achievement = achievements[achievementKey];
      
      dateDetails.totalAchievements++;
      dateDetails.achievementKeys.push(achievementKey);

      // ステータス分布をカウント
      switch (achievement.status) {
        case 'completed':
          debugResult.statusDistribution.completed++;
          break;
        case 'partial':
          debugResult.statusDistribution.partial++;
          break;
        case 'failed':
          debugResult.statusDistribution.failed++;
          break;
        default:
          debugResult.statusDistribution.other++;
      }
    }

    debugResult.achievementDetails[dateKey] = dateDetails;
  }

  return debugResult;
};