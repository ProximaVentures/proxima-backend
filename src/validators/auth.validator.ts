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

export const professionalProfileSchema = z.discriminatedUnion('category', [
    // Software Developer
    z.object({
        category: z.literal('SOFTWARE_DEVELOPER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            developerType: z.string().optional(),
            githubUrl: z.string().optional(),
            portfolioUrl: z.string().optional(),
            resumeUrl: z.string().optional(),
            yearsOfExperience: z.number().min(0).optional(),
            mainStack: z.array(z.string()).optional(),
            topProjects: z.array(ProjectSchema).optional(),
        }).passthrough().optional(),
    }),

    // Project Manager
    z.object({
        category: z.literal('PROJECT_MANAGER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            linkedinUrl: z.string().optional(),
            resumeUrl: z.string().optional(),
            certifications: z.array(z.string()).optional(),
            toolsUsed: z.array(z.string()).optional(),
            caseStudies: z.string().optional(),
        }).passthrough().optional(),
    }),

    // Product Designer
    z.object({
        category: z.literal('PRODUCT_DESIGNER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            portfolioUrl: z.string().optional(),
            behanceUrl: z.string().optional(),
            dribbbleUrl: z.string().optional(),
            tools: z.array(z.string()).optional(),
            topProjects: z.array(ProjectSchema).optional(),
        }).passthrough().optional(),
    }),

    // Graphic Designer
    z.object({
        category: z.literal('GRAPHIC_DESIGNER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            portfolioUrl: z.string().optional(),
            instagramUrl: z.string().optional(),
            tools: z.array(z.string()).optional(),
        }).passthrough().optional(),
    }),

    // Content Creator
    z.object({
        category: z.literal('CONTENT_CREATOR'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            portfolioUrl: z.string().optional(),
            socialMediaStats: z.any().optional(),
            niche: z.string().optional(),
        }).passthrough().optional(),
    }),

    // 📊 Digital Marketer
    z.object({
        category: z.literal('DIGITAL_MARKETER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            portfolioUrl: z.string().optional(),
            certifications: z.array(z.string()).optional(),
            campaignBudgetsManaged: z.string().optional(),
        }).passthrough().optional(),
    }),

    // Accountant
    z.object({
        category: z.literal('ACCOUNTANT'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            linkedinUrl: z.string().optional(),
            resumeUrl: z.string().optional(),
            certifications: z.array(z.string()).optional(),
            yearsOfExperience: z.number().optional(),
        }).passthrough().optional(),
    }),

    // Video Editor
    z.object({
        category: z.literal('VIDEO_EDITOR'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            portfolioUrl: z.string().optional(),
            softwareProficiency: z.array(z.string()).optional(),
        }).passthrough().optional(),
    }),

    // Social Media Manager
    z.object({
        category: z.literal('SOCIAL_MEDIA_MANAGER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            portfolioUrl: z.string().optional(),
            platformsManaged: z.array(z.string()).optional(),
        }).passthrough().optional(),
    }),

    // Lawyer
    z.object({
        category: z.literal('LAWYER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            linkedinUrl: z.string().optional(),
            barLicenseNumber: z.string().optional(),
            jurisdiction: z.string().optional(),
            specialization: z.string().optional(),
        }).passthrough().optional(),
    }),

    // HR Specialist
    z.object({
        category: z.literal('HR_SPECIALIST'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            linkedinUrl: z.string().optional(),
            resumeUrl: z.string().optional(),
            certifications: z.array(z.string()).optional(),
        }).passthrough().optional(),
    }),

    // Data Analyst
    z.object({
        category: z.literal('DATA_ANALYST'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            githubUrl: z.string().optional(),
            portfolioUrl: z.string().optional(),
            tools: z.array(z.string()).optional(),
            topProjects: z.array(ProjectSchema).optional(),
        }).passthrough().optional(),
    }),
]);

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
