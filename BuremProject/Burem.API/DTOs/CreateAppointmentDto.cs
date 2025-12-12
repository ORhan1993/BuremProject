namespace Burem.API.DTOs
{
    public class CreateAppointmentDto
    {
        // Hata almamak için tüm sayısal değerleri nullable (?) yapıyoruz
        public int? SessionId { get; set; }
        public int? TherapistId { get; set; }
        public int? UserId { get; set; }
        public int? CurrentUserRoleId { get; set; }

        // Tarih ve Saati string olarak alıp serviste işleyeceğiz (Format hatasını önler)
        public string? AppointmentDate { get; set; } // Örn: "2023-12-01"
        public string? AppointmentHour { get; set; } // Örn: "14:00"

        public string? AppointmentType { get; set; }
        public string? LocationOrLink { get; set; }
    }
}