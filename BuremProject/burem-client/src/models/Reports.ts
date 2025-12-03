export enum AppointmentStatus {
    Planned = 0,
    Completed = 1,
    NoShow = 2,
    Cancelled = 3
}

export interface IDashboardStats {
    totalAppointments: number;
    completedCount: number;
    noShowCount: number;
    cancelledCount: number;
    noShowRate: number;
    therapistStats: { category: string; count: number }[];
}