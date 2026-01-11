import { TripData, Member } from '../data/mockData';
import { TripStatistics, MemberProgress } from '../types/analytics';

// ============== ANALYTICS UTILITIES ==============

/**
 * คำนวณสถิติของทริป
 */
export const calculateTripStatistics = (trip: TripData): TripStatistics => {
  const totalMembers = trip.members?.length || 0;
  
  // Count completions
  const membersCompletedBudget = trip.members?.filter(m => 
    m.budget.accommodation > 0 && 
    m.budget.transport > 0 && 
    m.budget.food > 0
  ).length || 0;
  
  const membersVotedDates = trip.memberAvailability?.length || 0;
  const membersVotedProvinces = trip.provinceVotes?.length || 0;
  
  // Calculate rates
  const dateVotingRate = totalMembers > 0 ? Math.round((membersVotedDates / totalMembers) * 100) : 0;
  const budgetCompletionRate = totalMembers > 0 ? Math.round((membersCompletedBudget / totalMembers) * 100) : 0;
  const provinceVotingRate = totalMembers > 0 ? Math.round((membersVotedProvinces / totalMembers) * 100) : 0;
  
  // Overall completion (average of all three)
  const overallCompletionRate = Math.round((dateVotingRate + budgetCompletionRate + provinceVotingRate) / 3);
  
  // Time calculations
  const createdAt = trip.createdAt || Date.now();
  const now = Date.now();
  const totalDuration = Math.round((now - createdAt) / 60000); // minutes
  
  // Estimated time without system (baseline: 7-10 days = 10080-14400 minutes)
  // Use conservative estimate of 7 days
  const estimatedTimeWithoutSystem = 7 * 24 * 60; // 10080 minutes
  
  // Calculate time saved only if trip is mostly complete
  let actualTimeSaved: number | undefined;
  let timeSavedPercentage: number | undefined;
  
  if (overallCompletionRate >= 80) {
    actualTimeSaved = estimatedTimeWithoutSystem - totalDuration;
    timeSavedPercentage = Math.round((actualTimeSaved / estimatedTimeWithoutSystem) * 100);
  }
  
  return {
    createdAt,
    closedAt: trip.isCompleted ? now : undefined,
    totalDuration,
    totalMembers,
    membersCompletedBudget,
    membersVotedDates,
    membersVotedProvinces,
    totalActivities: membersVotedDates + membersCompletedBudget + membersVotedProvinces,
    averageTimeToComplete: totalMembers > 0 ? Math.round(totalDuration / totalMembers) : 0,
    dateVotingRate,
    budgetCompletionRate,
    provinceVotingRate,
    overallCompletionRate,
    estimatedTimeWithoutSystem,
    actualTimeSaved,
    timeSavedPercentage
  };
};

/**
 * คำนวณความคืบหน้าของแต่ละสมาชิก
 */
export const calculateMemberProgress = (trip: TripData): MemberProgress[] => {
  return (trip.members || []).map(member => {
    const dateSelected = trip.memberAvailability?.some(
      m => m.memberId === member.id
    ) || false;
    
    const budgetFilled = 
      member.budget.accommodation > 0 && 
      member.budget.transport > 0 && 
      member.budget.food > 0;
    
    const provinceVoted = trip.provinceVotes?.some(
      v => v.memberId === member.id
    ) || false;
    
    // Calculate completion percentage
    let completed = 0;
    if (dateSelected) completed++;
    if (budgetFilled) completed++;
    if (provinceVoted) completed++;
    const completionPercentage = Math.round((completed / 3) * 100);
    
    return {
      memberId: member.id,
      memberName: member.name,
      dateSelected,
      budgetFilled,
      provinceVoted,
      completionPercentage,
      lastActivityAt: member.budget.lastUpdated
    };
  });
};

/**
 * Format duration เป็น human-readable string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} นาที`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours < 24) {
    return mins > 0 ? `${hours} ชั่วโมง ${mins} นาที` : `${hours} ชั่วโมง`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours > 0) {
    return `${days} วัน ${remainingHours} ชั่วโมง`;
  }
  
  return `${days} วัน`;
};

/**
 * Get pending members (ยังไม่กรอกข้อมูลครบ)
 */
export const getPendingMembers = (trip: TripData): MemberProgress[] => {
  const allProgress = calculateMemberProgress(trip);
  return allProgress.filter(p => p.completionPercentage < 100);
};

/**
 * Auto-fill data based on majority
 */
export const autoFillFromMajority = (trip: TripData) => {
  // Get most common dates
  const allDates = trip.memberAvailability?.flatMap(m => m.availableDates) || [];
  const dateFrequency: Record<string, number> = {};
  
  allDates.forEach(date => {
    dateFrequency[date] = (dateFrequency[date] || 0) + 1;
  });
  
  const sortedDates = Object.entries(dateFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([date]) => date)
    .slice(0, trip.days || 3);
  
  // Calculate average budget
  const budgets = trip.members?.filter(m => 
    m.budget.accommodation > 0 && m.budget.transport > 0 && m.budget.food > 0
  ) || [];
  
  const avgBudget = {
    accommodation: 0,
    transport: 0,
    food: 0,
    other: 0
  };
  
  if (budgets.length > 0) {
    budgets.forEach(m => {
      avgBudget.accommodation += m.budget.accommodation;
      avgBudget.transport += m.budget.transport;
      avgBudget.food += m.budget.food;
      avgBudget.other += m.budget.other;
    });
    
    avgBudget.accommodation = Math.round(avgBudget.accommodation / budgets.length);
    avgBudget.transport = Math.round(avgBudget.transport / budgets.length);
    avgBudget.food = Math.round(avgBudget.food / budgets.length);
    avgBudget.other = Math.round(avgBudget.other / budgets.length);
  }
  
  // Get top 3 provinces
  const topProvinces = (trip.voteResults?.provinces || [])
    .slice(0, 3)
    .map(p => p.name);
  
  return {
    dates: sortedDates,
    budget: avgBudget,
    provinces: topProvinces
  };
};