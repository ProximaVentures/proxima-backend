import bcrypt from 'bcryptjs';
/**
 * Generates a 6-digit numeric OTP.
 */
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
/**
 * Hashes an OTP for secure storage.
 */
export const hashOTP = async (otp) => {
    return await bcrypt.hash(otp, 10);
};
/**
 * Verifies a plain OTP against a stored hash.
 */
export const compareOTP = async (otp, hash) => {
    return await bcrypt.compare(otp, hash);
};
//# sourceMappingURL=otp.js.map