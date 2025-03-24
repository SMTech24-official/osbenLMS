const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { generateToken } = require('../../utils/jwt.utils');

const { addDays, addMonths } = require('date-fns');
const generateOTP = require('../../utils/generateOTP');
const AppError = require('../../errors/AppError');

const createUser = async (userData) => {
  const { email, password, role, ...others } = userData;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('Email already exists', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Calculate access end date based on role
  const accessEndDate = role === 'PROVIDER' 
    ? addDays(new Date(), 3)  // 3 days for providers
    : addMonths(new Date(), 3);  // 3 months for students

  try {
    const result = await prisma.user.create({
      data: {
        ...others,
        email,
        password: hashedPassword,
        role,
        accessEndDate,
        lastLoginDate: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        studentId: true,
        accessEndDate: true,
        createdAt: true,
      },
    });

    return result;
  } catch (error) {
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('studentId')) {
        throw new AppError('Student ID already exists', 400);
      }
      throw new AppError('Email already exists', 400);
    }
    throw error;
  }
};

const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if access period has expired
  if (new Date() > user.accessEndDate) {
    throw new AppError('Your access period has expired', 403);
  }

  // Update last login date
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginDate: new Date() },
  });

  const token = generateToken({
    id: user.id,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessEndDate: user.accessEndDate,
    },
  };
};

const updateUser = async (id, updateData) => {
  const { email, password, studentId, ...others } = updateData;

  // If updating email, check if it already exists
  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id },
      },
    });

    if (existingUser) {
      throw new AppError('Email already exists', 400);
    }
  }

  // If updating studentId, check if it already exists
  if (studentId) {
    const existingUser = await prisma.user.findFirst({
      where: {
        studentId,
        NOT: { id },
      },
    });

    if (existingUser) {
      throw new AppError('Student ID already exists', 400);
    }
  }

  // If updating password, hash it
  const updatePayload = { ...others };
  if (email) updatePayload.email = email;
  if (studentId) updatePayload.studentId = studentId;
  if (password) {
    updatePayload.password = await bcrypt.hash(password, 12);
  }

  try {
    const result = await prisma.user.update({
      where: { id },
      data: updatePayload,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        studentId: true,
        accessEndDate: true,
        updatedAt: true,
      },
    });

    return result;
  } catch (error) {
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('studentId')) {
        throw new AppError('Student ID already exists', 400);
      }
      throw new AppError('Email already exists', 400);
    }
    throw error;
  }
};

const deleteUser = async (id) => {
  return await prisma.user.delete({
    where: { id },
  });
};

const getUser = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      studentId: true,
      accessEndDate: true,
      lastLoginDate: true,
      createdAt: true,
      enrollments: true,
      quizAttempts: true,
      certificates: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

const getAllUsers = async (
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  searchTerm = ''
) => {
  // Convert page and limit to numbers
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  
  // Calculate skip
  const skip = (pageNumber - 1) * limitNumber;

  // Prepare search condition
  const searchCondition = searchTerm
    ? {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { studentId: { contains: searchTerm, mode: 'insensitive' } },
        ],
      }
    : {};

  // Get total count
  const total = await prisma.user.count({
    where: searchCondition,
  });

  // Get users with pagination
  const users = await prisma.user.findMany({
    where: searchCondition,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      studentId: true,
      accessEndDate: true,
      lastLoginDate: true,
      createdAt: true,
    },
    skip,
    take: limitNumber,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  // Calculate pagination info
  const totalPage = Math.ceil(total / limitNumber);
  const currentPage = pageNumber;
  const hasNextPage = currentPage < totalPage;
  const hasPrevPage = currentPage > 1;

  return {
    data: users,
    meta: {
      page: currentPage,
      limit: limitNumber,
      total,
      totalPage,
      hasNextPage,
      hasPrevPage,
    },
  };
};

const updateProfile = async (userId, updateData) => {
  // Remove sensitive fields that shouldn't be updated
  const { password, role, email, ...updateFields } = updateData;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const result = await prisma.user.update({
    where: {
      id: userId,
    },
    data: updateFields,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return result;
};

const changePassword = async (userId, passwordData) => {
  const { oldPassword, newPassword } = passwordData;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });

  return { message: 'Password changed successfully' };
};

const updateRole = async (userId, roleData) => {
  const { role } = roleData;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role,
    },
  });

  return { message: 'Role updated successfully' };
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError('User not found with this email', 404);
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

  // Save OTP and expiration
  await prisma.user.update({
    where: {
      email,
    },
    data: {
      resetOTP: otp,
      otpExpiration,
    },
  });

  // In a real application, you would send this OTP via email
  // For development, we'll return it in the response
  return {
    message: 'OTP has been sent to your email',
    otp, // Remove this in production
  };
};

const resetPassword = async (resetData) => {
  const { email, otp, newPassword } = resetData;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!user.resetOTP || !user.otpExpiration) {
    throw new AppError('No OTP was requested', 400);
  }

  if (user.resetOTP !== otp) {
    throw new AppError('Invalid OTP', 400);
  }

  if (new Date() > user.otpExpiration) {
    throw new AppError('OTP has expired', 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      password: hashedPassword,
      resetOTP: null,
      otpExpiration: null,
    },
  });

  return { message: 'Password reset successfully' };
};

module.exports = {
  createUser,
  loginUser,
  updateUser,
  deleteUser,
  getUser,
  getAllUsers,
  updateProfile,
  changePassword,
  updateRole,
  forgotPassword,
  resetPassword,
};
