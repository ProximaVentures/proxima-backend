
import prisma from './src/utils/prisma.js';

async function test() {
    try {
        console.log('--- TESTING PRISMA CLIENT ---');
        // This will print the internal client structure for Message model
        const messageModel = (prisma as any)._runtimeDataModel?.models?.Message;
        if (messageModel) {
            console.log('Fields in Message model:', Object.keys(messageModel.fields));
            console.log('Relations in Message model:', messageModel.fields.filter((f: any) => f.kind === 'object').map((f: any) => f.name));
        } else {
            console.log('Message model not found in runtime data model');
            // Fallback for different prisma versions
            console.log('Available models:', Object.keys((prisma as any)));
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

test();
