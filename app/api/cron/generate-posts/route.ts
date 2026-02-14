import { NextResponse } from 'next/server';
import { generateMultiplePosts } from '@/lib/auto-generator';

export async function GET(request: Request) {
    try {
        // Verify authorization
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        if (authHeader !== expectedAuth) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Generate 10 posts
        console.log('🚀 Starting automated post generation...');
        const result = await generateMultiplePosts(10);

        return NextResponse.json({
            success: true,
            postsGenerated: result.success,
            failed: result.failed,
            errors: result.errors,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in cron job:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
