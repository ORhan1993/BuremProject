namespace Burem.API.DTOs
{
    public class CreateAppointmentDto
    {
        public int SessionId { get; set; }
        public int TherapistId { get; set; }
        public int? UserId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public String AppointmentHour { get; set; }
        public int DurationMinutes { get; set; } = 50; // Varsayılan süre
        public string AppointmentType { get; set; }
        public string LocationOrLink { get; set; }
    }
}
