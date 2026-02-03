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
        developerType: z.ZodEnum<{
            FRONTEND: "FRONTEND";
            BACKEND: "BACKEND";
            FULLSTACK: "FULLSTACK";
            MOBILE: "MOBILE";
            DEVOPS: "DEVOPS";
            GAME_DEV: "GAME_DEV";
            AI_ML_ENGINEER: "AI_ML_ENGINEER";
            DATA_ENGINEER: "DATA_ENGINEER";
            QA_ENGINEER: "QA_ENGINEER";
            OTHER: "OTHER";
        }>;
        githubUrl: z.ZodString;
        portfolioUrl: z.ZodString;
        resumeUrl: z.ZodString;
        yearsOfExperience: z.ZodNumber;
        mainStack: z.ZodArray<z.ZodString>;
        topProjects: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            role: z.ZodString;
            link: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    category: z.ZodLiteral<"SOFTWARE_DEVELOPER">;
}, z.core.$strip>, z.ZodObject<{
    metadata: z.ZodObject<{
        linkedinUrl: z.ZodString;
        resumeUrl: z.ZodString;
        certifications: z.ZodArray<z.ZodString>;
        toolsUsed: z.ZodArray<z.ZodString>;
        caseStudies: z.ZodString;
    }, z.core.$strip>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    category: z.ZodLiteral<"PROJECT_MANAGER">;
}, z.core.$strip>, z.ZodObject<{
    metadata: z.ZodObject<{
        portfolioUrl: z.ZodString;
        behanceUrl: z.ZodOptional<z.ZodString>;
        dribbbleUrl: z.ZodOptional<z.ZodString>;
        tools: z.ZodArray<z.ZodString>;
        topProjects: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            role: z.ZodString;
            link: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    category: z.ZodLiteral<"PRODUCT_DESIGNER">;
}, z.core.$strip>, z.ZodObject<{
    metadata: z.ZodObject<{
        portfolioUrl: z.ZodString;
        instagramUrl: z.ZodOptional<z.ZodString>;
        tools: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    category: z.ZodLiteral<"GRAPHIC_DESIGNER">;
}, z.core.$strip>, z.ZodObject<{
    metadata: z.ZodObject<{
        portfolioUrl: z.ZodString;
        socialMediaStats: z.ZodRecord<z.ZodString, z.ZodString>;
        niche: z.ZodString;
    }, z.core.$strip>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    category: z.ZodLiteral<"CONTENT_CREATOR">;
}, z.core.$strip>, z.ZodObject<{
    metadata: z.ZodObject<{
        portfolioUrl: z.ZodString;
        certifications: z.ZodArray<z.ZodString>;
        campaignBudgetsManaged: z.ZodString;
    }, z.core.$strip>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    category: z.ZodLiteral<"DIGITAL_MARKETER">;
}, z.core.$strip>, z.ZodObject<{
    metadata: z.ZodObject<{
        linkedinUrl: z.ZodString;
        resumeUrl: z.ZodString;
        certifications: z.ZodArray<z.ZodString>;
        yearsOfExperience: z.ZodNumber;
    }, z.core.$strip>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    category: z.ZodLiteral<"ACCOUNTANT">;
}, z.core.$strip>, z.ZodObject<{
    metadata: z.ZodObject<{
        portfolioUrl: z.ZodString;
        softwareProficiency: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    category: z.ZodLiteral<"VIDEO_EDITOR">;
}, z.core.$strip>, z.ZodObject<{
    metadata: z.ZodObject<{
        portfolioUrl: z.ZodString;
        platformsManaged: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    category: z.ZodLiteral<"SOCIAL_MEDIA_MANAGER">;
}, z.core.$strip>, z.ZodObject<{
    metadata: z.ZodObject<{
        linkedinUrl: z.ZodString;
        barLicenseNumber: z.ZodString;
        jurisdiction: z.ZodString;
        specialization: z.ZodString;
    }, z.core.$strip>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    category: z.ZodLiteral<"LAWYER">;
}, z.core.$strip>, z.ZodObject<{
    metadata: z.ZodObject<{
        linkedinUrl: z.ZodString;
        resumeUrl: z.ZodString;
        certifications: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    category: z.ZodLiteral<"HR_SPECIALIST">;
}, z.core.$strip>, z.ZodObject<{
    metadata: z.ZodObject<{
        githubUrl: z.ZodOptional<z.ZodString>;
        portfolioUrl: z.ZodString;
        tools: z.ZodArray<z.ZodString>;
        topProjects: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            role: z.ZodString;
            link: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    bio: z.ZodOptional<z.ZodString>;
    category: z.ZodLiteral<"DATA_ANALYST">;
}, z.core.$strip>], "category">;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfessionalProfileInput = z.infer<typeof professionalProfileSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
//# sourceMappingURL=auth.validator.d.ts.map