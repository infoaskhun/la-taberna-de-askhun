import { ErrorInfo } from '../errors/ErrorInfo';

export class ValidationResult<T = any> {
  public readonly isValid: boolean;
  public readonly errors: ErrorInfo[];
  public readonly data?: T;

  private constructor(isValid: boolean, errors: ErrorInfo[], data?: T) {
    this.isValid = isValid;
    this.errors = errors;
    this.data = data;
  }

  public static success<T>(data?: T): ValidationResult<T> {
    return new ValidationResult<T>(true, [], data);
  }

  public static failure(errors: ErrorInfo[]): ValidationResult {
    return new ValidationResult(false, errors);
  }
}
