import path from 'path';

/**
 * GitHub API Helper
 * Used to commit files directly to the repository during Vercel Cron executions.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
// Get Owner and Repo from Vercel env or default
// Assuming usage with `funkyts/gangnamimplant` based on previous git output
const REPO_OWNER = 'funkyts';
const REPO_NAME = 'gangnamimplant';
const BRANCH = 'main';

/**
 * Upload a file to GitHub
 * @param filePath Relative path in the repo (e.g., 'gangnamimplant-blog/content/blog/post.mdx')
 * @param content File content (string for text, Buffer for binary)
 * @param message Commit message
 */
export async function uploadToGithub(
    filePath: string,
    content: string | Buffer,
    message: string
): Promise<void> {
    if (!GITHUB_TOKEN) {
        console.warn('⚠️ GITHUB_TOKEN not found. Skipping GitHub upload.');
        return;
    }

    // Since the project is in a subdirectory 'gangnamimplant-blog', we need to prepend it
    // Wait, let's verify if the repo structure has 'gangnamimplant-blog' at root or if we are IN it.
    // Based on user context: /Users/shints/Documents/gangnamimplant/gangnamimplant-blog
    // And git remote output: https://github.com/funkyts/gangnamimplant.git
    // It seems the repo root IS likely 'gangnamimplant', and the nextjs app is in a subdir?
    // Let's assume the path needs to be relative to REPO ROOT.
    // If we are deploying the subdirectory to Vercel, Vercel might see the root as the app root.
    // But for GitHub API, we need the full path from repo root.
    // Let's assume the repo structure matches the local structure:
    // repo-root/
    //   gangnamimplant-blog/
    //     package.json
    //     ...

    // So we should prepend 'gangnamimplant-blog/' to the filePath if it's not already there.
    const fullPath = filePath.startsWith('gangnamimplant-blog/')
        ? filePath
        : `gangnamimplant-blog/${filePath}`;

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
