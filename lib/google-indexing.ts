import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

function getAuth() {
    // 1. Check for environment variable (Vercel Production)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        try {
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
            return new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/indexing'],
            });
        } catch (error) {
            console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON environment variable', error);
        }
    }

    // 2. Fallback to local file (Development)
    const keyFile = path.join(process.cwd(), 'service-account.json');
    if (fs.existsSync(keyFile)) {
        return new google.auth.GoogleAuth({
            keyFile: keyFile,
            scopes: ['https://www.googleapis.com/auth/indexing'],
        });
    }

    throw new Error('No Google Service Account credentials found (Env Var or File).');
}

/**
 * Notify Google about a URL update using the Indexing API.
 * 
 * @param url The URL to notify Google about.
 * @returns The response from the Indexing API.
 */
export async function indexUrl(url: string) {
    try {
        const auth = getAuth();

        const indexing = google.indexing({
            version: 'v3',
            auth: auth,
        });

        const response = await indexing.urlNotifications.publish({
            requestBody: {
                url: url,
                type: 'URL_UPDATED',
            },
        });

        console.log(`✅ [Indexing API] Successfully notified Google about: ${url}`);
        return response.data;
    } catch (error) {
        console.error(`❌ [Indexing API] Failed to notify Google about: ${url}`, error);
        // Do not throw error to prevent cron job failure
        return null;
    }
}

/**
 * Get the current notification status of a URL.
 * 
 * @param url The URL to check.
 * @returns The status response from the Indexing API.
 */
export async function getUrlStatus(url: string) {
    try {
        const auth = getAuth();

        const indexing = google.indexing({
            version: 'v3',
            auth: auth,
        });

        const response = await indexing.urlNotifications.getMetadata({
            url: url,
        });

        console.log(`✅ [Indexing API] Successfully retrieved status for: ${url}`);
        return response.data;
    } catch (error) {
        console.error(`❌ [Indexing API] Failed to get status for: ${url}`, error);
        throw error;
    }
}
