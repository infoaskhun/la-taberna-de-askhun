import { ConfigurationService } from '../config/ConfigurationService';

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

export class Logger {
  private config: ConfigurationService;
  private currentLevel: LogLevel;

  private levelNames: Record<LogLevel, string> = {
    [LogLevel.TRACE]: 'TRACE',
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.FATAL]: 'FATAL',
  };

  constructor(config: ConfigurationService) {
    this.config = config;
    this.currentLevel = this.parseLogLevel(config.logLevel);
  }

  private parseLogLevel(levelName: string): LogLevel {
    const name = levelName.toUpperCase();
    switch (name) {
      case 'TRACE': return LogLevel.TRACE;
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'FATAL': return LogLevel.FATAL;
      default: return LogLevel.INFO;
    }
  }

  private getTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) return;
    
    const levelStr = this.levelNames[level];
    const timestamp = this.getTimestamp();
    const formatted = `[${timestamp}] [${levelStr}] ${message}`;

    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      console.error(formatted, ...args);
    } else if (level === LogLevel.WARN) {
      console.warn(formatted, ...args);
    } else {
      console.log(formatted, ...args);
    }
  }

  public trace(message: string, ...args: any[]): void {
    this.log(LogLevel.TRACE, message, ...args);
  }

  public debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  public info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  public error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  public fatal(message: string, ...args: any[]): void {
    this.log(LogLevel.FATAL, message, ...args);
  }
}
