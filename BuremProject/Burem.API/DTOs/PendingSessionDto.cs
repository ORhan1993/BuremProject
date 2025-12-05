namespace Burem.API.DTOs
{
    public class PendingSessionDto
    {
        public int Id { get; set; } // SessionID
        public string Name { get; set; } // Öğrenci Adı
        public string Department { get; set; }
        public string RequestDate { get; set; } // "dd.MM.yyyy" formatında
    }
}