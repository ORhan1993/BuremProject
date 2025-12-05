namespace Burem.API.DTOs
{
    public class TherapistDashboardDto
    {
        public int Id { get; set; } // Randevu ID
        public string Time { get; set; } // "HH:mm"
        public string Date { get; set; } // "dd.MM.yyyy" (Takvim için)
        public string StudentName { get; set; }
        public string StudentId { get; set; } // Öğrenci No
        public string Type { get; set; } // "Online" / "Yüz Yüze"
        public string Status { get; set; } // "active", "completed"
        public string Note { get; set; } // Görüşme notu özeti
        public int CurrentSessionCount { get; set; } // Kaçıncı seans
    }
}