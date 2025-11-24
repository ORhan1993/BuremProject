
namespace Burem.API.DTOs
{
    public class TherapistAvailabilityDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Category { get; set; } // "BÜREM Uzmanı", "Gönüllü" vb.
        public int CurrentLoad { get; set; } // Üzerindeki aktif vaka sayısı
        public int DailySlots { get; set; }  // Bugün için boş saat sayısı
        public string Campus { get; set; }
        public List<string> WorkingDays { get; set; }
    }
}
