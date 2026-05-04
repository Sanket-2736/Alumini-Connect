import { z } from 'zod';
import mongoose from 'mongoose';
import { UserRole } from '@/lib/enums';

// ObjectId validation helper
const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: 'Invalid university ID format' }
);

/**
 * Registration validation schema
 */
export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  university: objectIdSchema,
  department: z.string().min(1, 'Department is required'),
  batch: z.string().min(1, 'Batch is required'),
  role: z.enum([UserRole.STUDENT, UserRole.ALUMNI]),
});

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Forgot password validation schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Reset password validation schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

/**
 * Update profile validation schema
 */
export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  workDetails: z.object({
    company: z.string().optional().refine(val => !val || val.length > 0, { message: 'Company must not be empty' }),
    jobTitle: z.string().optional().refine(val => !val || val.length > 0, { message: 'Job title must not be empty' }),
    experienceYears: z.number().min(0).optional(),
  }).optional(),
  skills: z.array(z.string()).optional(),
  socialLinks: z.object({
    linkedin: z.union([z.string().url(), z.literal('')]).optional(),
    github: z.union([z.string().url(), z.literal('')]).optional(),
    twitter: z.union([z.string().url(), z.literal('')]).optional(),
  }).optional(),
  batch: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
});

/**
 * Type definitions
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;