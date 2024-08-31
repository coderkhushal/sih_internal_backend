import { PrismaClient } from "@prisma/client";

export class DbManager {
    private static instance: DbManager;
    private client : PrismaClient;

    private constructor() {
        this.client = new PrismaClient();
    }

    public static getInstance(): DbManager {
        if (!DbManager.instance) {
            DbManager.instance = new DbManager();
        }

        return DbManager.instance;
    }

    public getClient(): PrismaClient {
        return this.client;
    }
}