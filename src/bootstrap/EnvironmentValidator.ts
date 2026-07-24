import { ValidationResult } from '../validators/ValidationResult';
import { ErrorInfo } from '../errors/ErrorInfo';

export class EnvironmentValidator {
  public static validate(): ValidationResult {
    const errors: ErrorInfo[] = [];

    const requiredVars = [
      'NODE_ENV',
      'DISCORD_TOKEN',
      'DISCORD_CLIENT_ID',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    // Check existence and empty value
    for (const variable of requiredVars) {
      const value = process.env[variable];
      if (value === undefined) {
        errors.push({
          category: 'ValidationError',
          message: `Environment variable "${variable}" is missing.`,
        });
      } else if (value.trim() === '') {
        errors.push({
          category: 'ValidationError',
          message: `Environment variable "${variable}" is empty.`,
        });
      }
    }

    // Check NODE_ENV value
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv && !['development', 'test', 'production'].includes(nodeEnv)) {
      errors.push({
        category: 'ValidationError',
        message: `Environment variable "NODE_ENV" has invalid value "${nodeEnv}". Allowed values: development, test, production.`,
      });
    }

    // Check SUPABASE_URL format
    const supabaseUrl = process.env.SUPABASE_URL;
    if (supabaseUrl && supabaseUrl.trim() !== '') {
      try {
        new URL(supabaseUrl);
      } catch (err) {
        errors.push({
          category: 'ValidationError',
          message: `Environment variable "SUPABASE_URL" has an invalid URL format: "${supabaseUrl}".`,
        });
      }
    }

    // Check LOG_LEVEL value
    const logLevel = process.env.LOG_LEVEL;
    if (logLevel && !['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'].includes(logLevel.toUpperCase())) {
      errors.push({
        category: 'ValidationError',
        message: `Environment variable "LOG_LEVEL" has invalid value "${logLevel}". Allowed values: TRACE, DEBUG, INFO, WARN, ERROR, FATAL.`,
      });
    }

    if (errors.length > 0) {
      return ValidationResult.failure(errors);
    }

    return ValidationResult.success();
  }
}
