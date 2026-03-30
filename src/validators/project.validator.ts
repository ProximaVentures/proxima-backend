import { z } from 'zod';

// Standard Project — matches the frontend form fields exactly
export const projectSchema = z.object({
    title: z.string().min(5, "Project title must be at least 5 characters"),
    description: z.string().min(50, "Please provide a detailed description (min 50 chars)"),
    targetAudience: z.string().min(1, "Target audience is required"),
    timeline: z.enum(["<1_month", "1-3_months", "3-6_months", "6_months+"]),
    specificNotes: z.string().optional(),
    briefUrl: z.string().url().optional(),
    briefName: z.string().optional(),
});

export const investmentPitchSchema = z.object({
    problemStatement: z.string().min(50),
    proposedSolution: z.string().min(50),
    usp: z.string().min(20),
    marketSize: z.string().min(10),
    competitors: z.string().optional(),
    traction: z.string().optional(),
    fundingAmount: z.string().min(1),
    equityOffered: z.string().min(1),
    useOfFunds: z.string().min(20),
    pitchDeckUrl: z.string().url(),
    businessPlanUrl: z.string().url().optional(),
});

export const projectUpdateSchema = projectSchema.partial();
export const investmentPitchUpdateSchema = investmentPitchSchema.partial();

export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type InvestmentPitchInput = z.infer<typeof investmentPitchSchema>;
export type InvestmentPitchUpdateInput = z.infer<typeof investmentPitchUpdateSchema>;
