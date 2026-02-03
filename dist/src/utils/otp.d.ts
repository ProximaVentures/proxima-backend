/**
 * Generates a 6-digit numeric OTP.
 */
export declare const generateOTP: () => string;
/**
 * Hashes an OTP for secure storage.
 */
export declare const hashOTP: (otp: string) => Promise<string>;
/**
 * Verifies a plain OTP against a stored hash.
 */
export declare const compareOTP: (otp: string, hash: string) => Promise<boolean>;
//# sourceMappingURL=otp.d.ts.map