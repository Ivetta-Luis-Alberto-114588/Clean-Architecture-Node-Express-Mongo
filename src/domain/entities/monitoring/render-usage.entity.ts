export interface RenderLimits {
  monthlyHours: number; // 750 for free tier
  sleepAfterMinutes: number; // 15 for free tier
  coldStartTime: string;
}

export interface RenderMonthlyUsage {
  hoursUsed: number;
  hoursRemaining: number;
  percentage: number;
  estimatedDepleteDate?: string;
}

export interface RenderInstanceInfo {
  uptime: string;
  memoryUsage: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  environment: string;
}

export class RenderUsageEntity {
  constructor(
    public service: string,
    public plan: string,
    public limits: RenderLimits,
    public currentMonth: RenderMonthlyUsage,
    public currentInstance: RenderInstanceInfo,
    public recommendations: string[],
    public timestamp: Date
  ) {}

  static create(data: {
    service: string;
    plan: string;
    limits: RenderLimits;
    currentMonth: RenderMonthlyUsage;
    currentInstance: RenderInstanceInfo;
    recommendations: string[];
  }): RenderUsageEntity {
    return new RenderUsageEntity(
      data.service,
      data.plan,
      data.limits,
      data.currentMonth,
      data.currentInstance,
      data.recommendations,
      new Date()
    );
  }

  isCritical(): boolean {
    return this.currentMonth.percentage > 90 || this.currentInstance.memoryUsage.percentage > 90;
  }

  isWarning(): boolean {
    return this.currentMonth.percentage > 75 || this.currentInstance.memoryUsage.percentage > 80;
  }

  getStatus(): 'healthy' | 'warning' | 'critical' {
    if (this.isCritical()) return 'critical';
    if (this.isWarning()) return 'warning';
    return 'healthy';
  }
}
