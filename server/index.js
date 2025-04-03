import { execFile } from 'child_process';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // Required for handling file uploads
  },
};

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();
  form.uploadDir = "./public/uploads"; // Ensure this folder exists
  form.keepExtensions = true;

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'File upload failed' });
    }

    const inputPath = files.image.filepath;
    const mode = fields.mode; // 'compress' or 'decompress'
    
    if (!['compress', 'decompress'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Use "compress" or "decompress".' });
    }

    const flag = mode === 'compress' ? '-c' : '-d';

    // Run the compressor executable
    const process = execFile('./40image-c', [flag, inputPath], { encoding: 'buffer' }, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: `Processing failed: ${stderr.toString()}` });
      }

      res.setHeader('Content-Type', 'image/x-portable-pixmap'); // PPM file type
      res.setHeader('Content-Disposition', `attachment; filename="${mode}.ppm"`);
      res.send(stdout);
    });

    process.stdin.end(); // Ensure the process completes
  });
}
