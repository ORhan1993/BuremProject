namespace Burem.API.DTOs
{
    public class CreateAppointmentDto
    {
        // Sayıları 'int?' (Nullable) yapıyoruz ki boş gelirse 0 değil null olsun, hata vermesin.
        public int? SessionId { get; set; }
        public int? TherapistId { get; set; }
        public int? UserId { get; set; }
        public int CurrentUserRoleId { get; set; }

        // Tarihleri 'string?' yapıyoruz. Format hatası (400) almayı engelliyoruz.
        public string? AppointmentDate { get; set; } // Örn: "2025-11-25"
        public string? AppointmentHour { get; set; } // Örn: "09:00"

        public string? AppointmentType { get; set; }
        public string? LocationOrLink { get; set; }
    }
}