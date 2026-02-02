import { z } from 'zod';

// Professor's Tip: Use "Discriminated Unions" to handle different shapes of data
// based on a single field (like 'role'). This is Type-Safety at its finest!

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
    bio: z.string().max(500).optional(),
});

// Proof of Work Schema
const ProjectSchema = z.object({
    name: z.string().min(3, "Project name is required"),
    description: z.string().min(20, "Description must be detailed (min 20 chars)"),
    role: z.string().min(3, "Your role is required"),
    link: z.string().url("Project link must be a valid URL"),
});

export const professionalProfileSchema = z.discriminatedUnion('category', [
    // Software Developer (Strict)
    z.object({
        category: z.literal('SOFTWARE_DEVELOPER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            developerType: z.enum([
                'FRONTEND',
                'BACKEND',
                'FULLSTACK',
                'MOBILE',
                'DEVOPS',
                'GAME_DEV',
                'AI_ML_ENGINEER',
                'DATA_ENGINEER',
                'QA_ENGINEER',
                'OTHER'
            ], { required_error: "Please select your developer specialization" }),
            githubUrl: z.string().url("GitHub URL is required for code verification"),
            portfolioUrl: z.string().url("Portfolio URL is required"),
            resumeUrl: z.string().url("Resume/CV link is required"),
            yearsOfExperience: z.number().min(0),
            mainStack: z.array(z.string()).min(1, "At least one technology is required"),
            topProjects: z.array(ProjectSchema).length(2, "You must submit exactly 2 top projects"),
        }),
    }),

    // Project Manager
    z.object({
        category: z.literal('PROJECT_MANAGER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            linkedinUrl: z.string().url(),
            resumeUrl: z.string().url("Resume/CV link is required"),
            certifications: z.array(z.string()).min(1, "At least one certification (e.g., PMP, CSM) is required"),
            toolsUsed: z.array(z.string()),
            caseStudies: z.string().url("Link to case studies or portfolio is required"),
        }),
    }),

    // Product Designer
    z.object({
        category: z.literal('PRODUCT_DESIGNER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            portfolioUrl: z.string().url("Portfolio URL is required"),
            behanceUrl: z.string().url().optional(),
            dribbbleUrl: z.string().url().optional(),
            tools: z.array(z.string()),
            topProjects: z.array(ProjectSchema).length(2, "You must submit exactly 2 top projects"),
        }),
    }),

    // Graphic Designer
    z.object({
        category: z.literal('GRAPHIC_DESIGNER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            portfolioUrl: z.string().url("Portfolio URL is required"),
            instagramUrl: z.string().url().optional(),
            tools: z.array(z.string()),
        }),
    }),

    // Content Creator
    z.object({
        category: z.literal('CONTENT_CREATOR'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            portfolioUrl: z.string().url("Portfolio/Blog URL is required"),
            socialMediaStats: z.record(z.string()), // e.g., { "instagram": "10k" }
            niche: z.string(),
        }),
    }),

    // 📊 Digital Marketer
    z.object({
        category: z.literal('DIGITAL_MARKETER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            portfolioUrl: z.string().url("Portfolio/Case Studies URL is required"),
            certifications: z.array(z.string()),
            campaignBudgetsManaged: z.string(), // e.g., "$10k/month"
        }),
    }),

    // Accountant
    z.object({
        category: z.literal('ACCOUNTANT'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            linkedinUrl: z.string().url(),
            resumeUrl: z.string().url("Resume/CV link is required"),
            certifications: z.array(z.string()).min(1, "CPA/ACCA or equivalent required"),
            yearsOfExperience: z.number().min(1),
        }),
    }),

    // Video Editor
    z.object({
        category: z.literal('VIDEO_EDITOR'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            portfolioUrl: z.string().url("Showreel/Portfolio Link is required"),
            softwareProficiency: z.array(z.string()),
        }),
    }),

    // Social Media Manager
    z.object({
        category: z.literal('SOCIAL_MEDIA_MANAGER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            portfolioUrl: z.string().url("Portfolio Link is required"),
            platformsManaged: z.array(z.string()),
        }),
    }),

    // Lawyer
    z.object({
        category: z.literal('LAWYER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            linkedinUrl: z.string().url(),
            barLicenseNumber: z.string().min(5, "Bar License Number is required"),
            jurisdiction: z.string(),
            specialization: z.string(),
        }),
    }),

    // HR Specialist
    z.object({
        category: z.literal('HR_SPECIALIST'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            linkedinUrl: z.string().url(),
            resumeUrl: z.string().url("Resume/CV link is required"),
            certifications: z.array(z.string()),
        }),
    }),

    // Data Analyst
    z.object({
        category: z.literal('DATA_ANALYST'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            githubUrl: z.string().url().optional(),
            portfolioUrl: z.string().url("Portfolio/Kaggle Link is required"),
            tools: z.array(z.string()),
            topProjects: z.array(ProjectSchema).length(2, "You must submit exactly 2 top projects"),
        }),
    }),
]);

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfessionalProfileInput = z.infer<typeof professionalProfileSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
