namespace Burem.Data.Models
{
    public class TherapistType
    {
        public int Id { get; set; }
        public string Name { get; set; } // Örn: "Deneyimli Uzman", "Gönüllü Uzman"
        public bool IsActive { get; set; }
        // İlişki
        public virtual ICollection<Therapist> Therapists { get; set; }
    }
}