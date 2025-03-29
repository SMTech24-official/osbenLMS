const prisma = require('../../utils/prisma');
const { startOfMonth, endOfMonth, format, subMonths } = require('date-fns');

/**
 * Get dashboard summary statistics
 * Returns total users, courses, and active subscriptions
 */
const getDashboardSummary = async () => {
  // Get counts using Promise.all for parallel execution
  const [totalUsers, totalCourses, activeSubscriptions] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.user.count({
      where: {
        subscriptionId: { not: null },
        accessEndDate: { gt: new Date() }
      }
    })
  ]);

  return {
    totalUsers,
    totalCourses,
    activeSubscriptions
  };
};

/**
 * Get user registration data by month
 * Returns user count for each month in the specified year
 */
const getUserRegistrationsByMonth = async (year = new Date().getFullYear()) => {
  // Convert year to number if it's a string
  const yearNum = Number(year);
  
  // Create an array to hold monthly data
  const monthlyData = [];
  
  // Get current date to determine how many months to include for current year
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // Determine how many months to process
  const monthsToProcess = yearNum < currentYear ? 12 : currentMonth + 1;
  
  // Process each month
  for (let month = 0; month < monthsToProcess; month++) {
    const startDate = new Date(yearNum, month, 1);
    const endDate = endOfMonth(startDate);
    
    // Count users registered in this month
    const userCount = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    // Format month name
    const monthName = format(startDate, 'MMM');
    
    monthlyData.push({
      month: monthName,
      count: userCount
    });
  }
  
  return monthlyData;
};

/**
 * Get user registration data by day for a specific month
 * Returns user count for each day in the specified month
 */
const getUserRegistrationsByDay = async (monthYear) => {
  // Parse the month and year from the input (e.g., "Jul, 2024")
  const [monthName, yearStr] = monthYear.split(', ');
  const year = parseInt(yearStr);
  
  // Map month name to month number (0-11)
  const monthMap = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  
  const month = monthMap[monthName];
  
  if (month === undefined || isNaN(year)) {
    throw new Error('Invalid month or year format');
  }
  
  // Get the start and end of the month
  const startDate = new Date(year, month, 1);
  const endDate = endOfMonth(startDate);
  
  // Get all users registered in this month
  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      createdAt: true
    }
  });
  
  // Initialize daily data with all days of the month
  const daysInMonth = endDate.getDate();
  const dailyData = [];
  
  // Initialize counts for each day
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    dailyData.push({
      day: format(date, 'EEE'), // Day abbreviation (Mon, Tue, etc.)
      date: day,
      count: 0
    });
  }
  
  // Count users for each day
  users.forEach(user => {
    const day = user.createdAt.getDate();
    dailyData[day - 1].count += 1;
  });
  
  // Calculate percentages based on the maximum count
  const maxCount = Math.max(...dailyData.map(d => d.count), 1); // Avoid division by zero
  
  dailyData.forEach(data => {
    data.percentage = Math.round((data.count / maxCount) * 100);
  });
  
  return {
    month: monthYear,
    dailyData
  };
};

module.exports = {
  getDashboardSummary,
  getUserRegistrationsByMonth,
  getUserRegistrationsByDay
};
