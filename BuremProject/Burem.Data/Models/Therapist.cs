using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Burem.Data.Models
{
    public class Therapist
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public int RoleId { get; set; }

        // --- 1. Uzman Türü İlişkisi ---
        // Veritabanındaki 'TherapistTypeId' sütunu
        public int TherapistTypeId { get; set; }

        // Bu property veritabanında sütun olmaz, kod içinde 'therapist.TherapistType.Name' diyebilmeni sağlar.
        [ForeignKey("TherapistTypeId")]
        public virtual TherapistType TherapistType { get; set; }


        // --- 2. Kampüs (Lokasyon) İlişkisi ---
        // Veritabanındaki 'CampusId' sütunu
        public int CampusId { get; set; }

        // Kod içinde 'therapist.Campus.Name' diyebilmek için.
        [ForeignKey("CampusId")]
        public virtual Campus Campus { get; set; }


        // --- 3. Aktiflik Durumu ---
        // SQL'deki 'DEFAULT 1' karşılığı olarak burada da true veriyoruz.
        public bool IsActive { get; set; }

        // Uzmanın randevularını tutan liste
        public virtual ICollection<Appointment> Appointments { get; set; }
    }
}