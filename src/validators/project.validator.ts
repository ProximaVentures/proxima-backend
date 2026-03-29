import { z } from 'zod';

// Projects can now be anything professional (not just tech)
export const projectSchema = z.object({
    title: z.string().min(5, "Project title must be at least 5 characters"),
    description: z.string().min(50, "Please provide a detailed description (min 50 chars)"),
    targetAudience: z.string().min(1, "Target audience or goal description is required"),
    industry: z.array(z.string()).min(1, "Select at least one industry/domain"),
    requirements: z.string().min(20, "List the core requirements or deliverables"),
    specificNotes: z.string().optional(),
    budgetRange: z.enum(["<5k", "5k-10k", "10k-25k", "25k-50k", "50k+"]),
    timeline: z.enum(["<1_month", "1-3_months", "3-6_months", "6_months+"]),
    coverImageUrl: z.string().url().optional(),
    briefUrl: z.string().url().optional(),
    briefName: z.string().optional(),
    category: z.string().min(2, "Category is required"),
    categoryData: z.record(z.string(), z.any()).optional(),
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
