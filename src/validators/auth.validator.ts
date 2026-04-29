import { z } from 'zod';

// Use discriminated unions for strict schema validation.

/**
 * Stage 1: Basic Registration Schema
 * Validates the initial signup form.
 */
export const registerSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().optional(),
    role: z.enum(['CLIENT', 'PROFESSIONAL', 'ADMIN']),
});

/**
 * Stage 2: Professional Profile Completion
 * This is where the Discrimination happens.
 */
const BaseProfileSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    jobTitle: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    avatarUrl: z.string().optional(),
    bio: z.string().max(1000).optional(),
    preferences: z.any().optional(), // Flexible JSON configuration
});

// Proof of Work Schema
const ProjectSchema = z.object({
    name: z.string().min(3, "Project name is required"),
    description: z.string().min(20, "Description must be detailed (min 20 chars)"),
    role: z.string().min(3, "Your role is required"),
    link: z.string().url("Project link must be a valid URL"),
});

export const professionalProfileSchema = z.object({
    category: z.enum([
        'SOFTWARE_DEVELOPMENT',
        'DIGITAL_MARKETING',
        'CONTENT_CREATION',
        'DESIGN_VISUAL',
        'DATA_AL',
        'PRODUCT_STRATEGY',
        'CYBER_SECURITY',
        'FINANCE_LEGAL',
        'PROJECT_MANAGEMENT',
        'HR_TALENT',
        'CUSTOMER_SUCCESS',
        'OTHER'
    ]).optional(),
    ...BaseProfileSchema.shape,
    metadata: z.any().optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const socialLoginSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    provider: z.enum(['google', 'facebook']),
    providerId: z.string().min(1),
    image: z.string().url().optional(),
    token: z.string().optional(), // Added for secure backend verification
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfessionalProfileInput = z.infer<typeof professionalProfileSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
