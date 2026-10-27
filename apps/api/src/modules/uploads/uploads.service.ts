import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import { InventoryErrorCode, UPLOAD_IMAGE_TYPES } from '@dzen/shared';
import { AppError } from '../../middleware/error.js';

const ALLOWED = new Set<string>(UPLOAD_IMAGE_TYPES);

export class UploadsService {
  constructor(private readonly directory: string) {}

  async saveImage(buffer: Buffer): Promise<string> {
    const detected = await fileTypeFromBuffer(buffer);

    if (!detected || !ALLOWED.has(detected.mime)) {
      throw new AppError(
        415,
        InventoryErrorCode.UnsupportedFile,
        'Only JPEG, PNG and WebP images are allowed',
      );
    }

    const name = `${randomUUID()}.${detected.ext}`;
    await mkdir(this.directory, { recursive: true });
    await writeFile(path.join(this.directory, name), buffer);

    return `/uploads/${name}`;
  }
}
