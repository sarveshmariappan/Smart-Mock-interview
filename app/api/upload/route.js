import fs from 'fs';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');
        const userId = formData.get('userId');

        if (!file || !userId) {
            return Response.json(
                { error: 'Missing file or userId' },
                { status: 400 }
            );
        }

        // Validate file is an image
        if (!file.type.startsWith('image/')) {
            return Response.json(
                { error: 'Only image files are allowed' },
                { status: 400 }
            );
        }

        // Limit file size to 5 MB
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return Response.json(
                { error: 'File size must be less than 5 MB' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure uploads directory exists
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        try {
            await mkdir(uploadsDir, { recursive: true });
        } catch (mkdirErr) {
            console.error('Error creating uploads directory:', mkdirErr);
            // Continue anyway, directory might already exist
        }

        // Generate unique filename with timestamp to avoid collisions
        const ext = file.type.split('/')[1] || 'jpg';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const filename = `${userId}-${timestamp}-${random}.${ext}`;
        const filepath = path.join(uploadsDir, filename);

        // Write file to disk
        await writeFile(filepath, buffer);

        // Return public URL
        const publicURL = `/uploads/${filename}`;

        return Response.json(
            { url: publicURL, filename },
            { status: 200 }
        );
    } catch (err) {
        console.error('Upload error:', err);
        return Response.json(
            { error: err.message || 'Upload failed' },
            { status: 500 }
        );
    }
}
