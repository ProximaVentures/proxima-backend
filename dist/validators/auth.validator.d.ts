import { z } from 'zod';
/**
 * Stage 1: Basic Registration Schema
 * Validates the initial signup form.
 */
export declare const registerSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<{
        CLIENT: "CLIENT";
        PROFESSIONAL: "PROFESSIONAL";
        ADMIN: "ADMIN";
    }>;
}, z.core.$strip>;
export declare const professionalProfileSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    metadata: z.ZodObject<{
        githubUrl: z.ZodString;
        portfolioUrl: z.ZodOptional<z.ZodString>;
        yearsOfExperience: z.ZodNumber;
        mainStack: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    category: z.ZodLiteral<"SOFTWARE_DEVELOPER">;
}, z.core.$strip>, z.ZodObject<{
    metadata: z.ZodObject<{
        linkedinUrl: z.ZodString;
        certifications: z.ZodArray<z.ZodString>;
        toolsUsed: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    category: z.ZodLiteral<"PROJECT_MANAGER">;
}, z.core.$strip>, z.ZodObject<{
    metadata: z.ZodObject<{
        behanceUrl: z.ZodOptional<z.ZodString>;
        dribbbleUrl: z.ZodOptional<z.ZodString>;
        tools: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    category: z.ZodLiteral<"PRODUCT_DESIGNER">;
}, z.core.$strip>], "category">;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfessionalProfileInput = z.infer<typeof professionalProfileSchema>;
//# sourceMappingURL=auth.validator.d.ts.map