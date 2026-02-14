import Together from 'together-ai';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Lazy initialize Together client to ensure env vars are loaded
let togetherClient: Together | null = null;
function getTogether(): Together {
    if (!togetherClient) {
        togetherClient = new Together({
            apiKey: process.env.TOGETHER_API_KEY,
        });
    }
    return togetherClient;
}

/**
 * Translate Korean keyword to English prompt
 */
function translateToPrompt(keyword: string): string {
    // Simple translation mapping for dental terms
    const translations: Record<string, string> = {
        '임플란트': 'dental implant',
        '가격': 'price consultation',
        '치과': 'dental clinic',
        '강남': 'Gangnam',
        '크라운': 'dental crown',
        '보철': 'dental prosthesis',
        '뼈이식': 'bone graft',
        '교정': 'orthodontic treatment',
        '미백': 'teeth whitening',
        '치아': 'teeth',
    };

    // Try to translate known terms
    let englishTerms = keyword.split(' ').map((term) => {
        return translations[term] || term;
    });

    return englishTerms.join(' ');
}

/**
 * Generate professional dental clinic image
 */
export async function generateDentalImage(keyword: string, index: number = 0): Promise<string> {
    try {
        const englishKeyword = translateToPrompt(keyword);

        const prompts = [
            `Professional modern dental clinic interior, clean and bright, medical equipment, ${englishKeyword}, welcoming atmosphere, high quality, photorealistic, 4k`,
            `Dental professional consultation room showing ${englishKeyword}, modern medical facility, clean environment, professional lighting, detailed, realistic`,
            `Close-up view of ${englishKeyword} in professional dental setting, medical equipment, sterile environment, high quality, photorealistic`,
        ];

        const selectedPrompt = prompts[index % prompts.length];

        console.log(`🎨 Generating image for: ${keyword}`);
        console.log(`   Prompt: ${selectedPrompt}`);

        const response = await getTogether().images.create({
            model: 'black-forest-labs/FLUX.1-schnell',
            prompt: selectedPrompt,
            width: 1024,
            height: 768,
            steps: 4,
            n: 1,
        });

        // Debug: Log response structure
        console.log('📊 API Response:', JSON.stringify(response, null, 2));

        // Get image data (base64 or URL)
        const imageData = response.data[0] as any;

        let imageBuffer: Buffer;

        if (imageData.b64_json) {
            // Base64 response
            imageBuffer = Buffer.from(imageData.b64_json, 'base64');
        } else if (imageData.url) {
            // URL response - need to fetch
            console.log('🔗 Fetching image from URL:', imageData.url);
            const imageResponse = await fetch(imageData.url);
            const arrayBuffer = await imageResponse.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
        } else {
            throw new Error('No image data received (neither b64_json nor url)');
        }

        // Generate filename
        const timestamp = Date.now();
        const sanitizedKeyword = keyword.replace(/\s+/g, '-').replace(/[^a-z0-9가-힣-]/gi, '');
        const filename = `${sanitizedKeyword}-${timestamp}-${index}.webp`;
        const outputPath = path.join(process.cwd(), 'public/images/blog', filename);

        // Ensure directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Optimize and save as WebP
        await sharp(imageBuffer)
            .resize(1200, 900, {
                fit: 'cover',
                position: 'center',
            })
            .webp({ quality: 85 })
            .toFile(outputPath);

        // Get file size
        const stats = fs.statSync(outputPath);
        const fileSizeKB = Math.round(stats.size / 1024);

        console.log(`✅ Image saved: ${filename} (${fileSizeKB}KB)`);

        // Return relative path for use in markdown
        return `/images/blog/${filename}`;
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
}

/**
 * Generate multiple images for a blog post
 */
export async function generatePostImages(
    keyword: string,
    count: number = 3
): Promise<string[]> {
    const imageUrls: string[] = [];

    for (let i = 0; i < count; i++) {
        try {
            const url = await generateDentalImage(keyword, i);
            imageUrls.push(url);

            // Add delay between requests to avoid rate limiting
            if (i < count - 1) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.error(`Failed to generate image ${i + 1}:`, error);
            // Continue with other images even if one fails
        }
    }

    return imageUrls;
}
