import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

export class EnvironmentLoader {
  public static load(): void {
    const envPath = path.resolve(process.cwd(), '.env');
    
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    } else {
      // In production (Railway), variables are already in process.env, so no error is thrown
      // But we can print a silent debug or notice
    }
  }
}
