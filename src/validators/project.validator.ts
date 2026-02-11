import { z } from 'zod';

// Projects can now be anything professional (not just tech)
export const projectSchema = z.object({
    title: z.string().min(5, "Project title must be at least 5 characters"),
    description: z.string().min(50, "Please provide a detailed description (min 50 chars)"),
    targetAudience: z.string().min(10, "Target audience or goal description is required"),
    industry: z.array(z.string()).min(1, "Select at least one industry/domain"),
    requirements: z.string().min(20, "List the core requirements or deliverables"),
    specificNotes: z.string().optional(),
    budgetRange: z.enum(["UNDER_5K", "FROM_5K_TO_10K", "FROM_10K_TO_25K", "FROM_25K_TO_50K", "ABOVE_50K"]),
    timeline: z.enum(["UNDER_1_MONTH", "FROM_1_TO_3_MONTHS", "FROM_3_TO_6_MONTHS", "ABOVE_6_MONTHS"]),
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

export type ProjectInput = z.infer<typeof projectSchema>;
export type InvestmentPitchInput = z.infer<typeof investmentPitchSchema>;
