import path from 'path';

/**
 * GitHub API Helper
 * Used to commit files directly to the repository during Vercel Cron executions.
 */

export async function uploadToGithub(
    filePath: string,
    content: string | Buffer,
    message: string
): Promise<void> {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = 'funkyts';
    const REPO_NAME = 'gangnamimplant';
    const BRANCH = 'main';

    if (!GITHUB_TOKEN) {
        console.warn('⚠️ GITHUB_TOKEN not found. Skipping GitHub upload.');
        return;
    }

    // The repo root is the project root, so we use the filePath as is.
    const fullPath = filePath;

    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fullPath}`;

    try {
        // 1. Check if file exists to get SHA (for update)
        let sha: string | undefined;
        const checkResponse = await fetch(url, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });

        if (checkResponse.ok) {
            const data = await checkResponse.json();
            sha = data.sha;
        }

        // 2. Prepare content (Base64)
        const contentBase64 = Buffer.isBuffer(content)
            ? content.toString('base64')
            : Buffer.from(content).toString('base64');

        // 3. Create or Update file
        const body = {
            message,
            content: contentBase64,
            branch: BRANCH,
            ...(sha ? { sha } : {}),
        };

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        console.log(`✅ GitHub Upload Success: ${fullPath}`);
    } catch (error) {
        console.error(`❌ GitHub Upload Failed: ${fullPath}`, error);
        // Don't throw logic error to prevent stopping the whole process, but log it.
    }
}
