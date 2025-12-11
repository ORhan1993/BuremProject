namespace Burem.API.DTOs
{
    public class TherapistAppointmentDto
    {
        public int Id { get; set; }
        public string StudentName { get; set; }
        public string StudentId { get; set; } // Öğrenci No
        public string Date { get; set; }
        public string Time { get; set; }
        public string Type { get; set; } // Online / Yüz Yüze
        public string Status { get; set; }
        public string Note { get; set; }
        public int CurrentSessionCount { get; set; }
    }
}