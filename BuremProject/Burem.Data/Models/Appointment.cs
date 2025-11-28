using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Burem.Data.Models
{
    public class Appointment
    {
        [Key]
        public int Id { get; set; }

        // Hangi başvuruya ait?
        public int SessionId { get; set; }
        [ForeignKey("SessionId")]
        public virtual Session Session { get; set; }

        // Hangi terapist atandı? (Doktor/Uzman)
        public int TherapistId { get; set; }
        [ForeignKey("TherapistId")]
        public virtual User Therapist { get; set; }


        // Randevuyu hangi kullanıcı verdi?
        public int? UserId { get; set; } // Veritabanında NULL olabildiği için int? yaptık.
        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        public DateTime AppointmentDate { get; set; } // Tarih ve Saat birlikte

        public string AppointmentType { get; set; } // "Yüz Yüze" veya "Online"

        public string LocationOrLink { get; set; } // Oda adı veya Zoom linki

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}