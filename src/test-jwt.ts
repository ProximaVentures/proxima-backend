import jwt from 'jsonwebtoken';
import 'dotenv/config';

const secret = process.env.JWT_SECRET || 'secret';
console.log('Using secret:', secret);

const payload = { userId: 'test-user', role: 'ADMIN' };
const token = jwt.sign(payload, secret, { expiresIn: '1d' });
console.log('Signed token:', token);

try {
    const decoded = jwt.verify(token, secret);
    console.log('Verified successfully:', decoded);
} catch (err) {
    console.error('Verification failed:', err.message);
}
