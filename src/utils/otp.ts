import bcrypt from 'bcryptjs';

/**
 * Generates a 6-digit numeric OTP.
 */
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hashes an OTP for secure storage.
 */
export const hashOTP = async (otp: string): Promise<string> => {
    return await bcrypt.hash(otp, 10);
};

/**
 * Verifies a plain OTP against a stored hash.
 */
export const compareOTP = async (otp: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(otp, hash);
};
