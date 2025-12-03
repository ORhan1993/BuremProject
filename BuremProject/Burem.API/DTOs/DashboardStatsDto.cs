namespace Burem.API.DTOs
{
    // Rapor Sonuç Modeli
    public class DashboardStatsDto
    {
        public int TotalAppointments { get; set; }
        public int CompletedCount { get; set; }
        public int NoShowCount { get; set; }
        public int CancelledCount { get; set; }
        public double NoShowRate { get; set; }
        public List<TherapistStatDto> TherapistStats { get; set; }
    }
}
