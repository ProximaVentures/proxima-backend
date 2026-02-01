/**
 * Generates a 6-digit numeric OTP.
 */
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
//# sourceMappingURL=otp.js.map