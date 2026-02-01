import { z } from 'zod';

// 🏫 Professor's Tip: Use "Discriminated Unions" to handle different shapes of data
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

export const professionalProfileSchema = z.discriminatedUnion('category', [
    // 💻 Software Developer Specifics
    z.object({
        category: z.literal('SOFTWARE_DEVELOPER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            githubUrl: z.string().url(),
            portfolioUrl: z.string().url().optional(),
            yearsOfExperience: z.number().min(0),
            mainStack: z.array(z.string()),
        }),
    }),

    // 📈 Project Manager Specifics
    z.object({
        category: z.literal('PROJECT_MANAGER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            linkedinUrl: z.string().url(),
            certifications: z.array(z.string()),
            toolsUsed: z.array(z.string()),
        }),
    }),

    // 🎨 Product Designer Specifics
    z.object({
        category: z.literal('PRODUCT_DESIGNER'),
        ...BaseProfileSchema.shape,
        metadata: z.object({
            behanceUrl: z.string().url().optional(),
            dribbbleUrl: z.string().url().optional(),
            tools: z.array(z.string()),
        }),
    }),

    // 🏫 Professor's Tip: You would add the rest of the 12 categories here 
    // following the same pattern. 
]);

export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfessionalProfileInput = z.infer<typeof professionalProfileSchema>;
