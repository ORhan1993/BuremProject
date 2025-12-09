namespace Burem.Data.Models
{
    public class Campus
    {
        public int Id { get; set; }
        public string Name { get; set; } // Örn: "Kuzey Kampüs", "Güney Kampüs"

        public bool IsActive { get; set; }
        // İlişki
        public virtual ICollection<Therapist> Therapists { get; set; }
    }
}