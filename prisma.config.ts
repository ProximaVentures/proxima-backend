import { defineConfig } from '@prisma/sdk'; // Note: In some versions it might be different, let's use the standard export format

export default {
    datasource: {
        url: process.env.DATABASE_URL,
    },
};
