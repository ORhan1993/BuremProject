namespace Burem.API.DTOs
{
    public class CreateAppointmentDto
    {
        public int SessionId { get; set; }
        public int TherapistId { get; set; }
        public string Date { get; set; } // "dd.MM.yyyy" formatında gelecek
        public string Time { get; set; } // "HH:mm" formatında gelecek
        public string Type { get; set; } // "Online", "Yüz Yüze"
        public string RoomLink { get; set; }
    }
}
