using Burem.Data.Enums;
using System;
using System.ComponentModel.DataAnnotations.Schema;
// Enum namespace'ini eklemeyi unutmayın (namespace Burem.Data.Models ise gerekmez)

namespace Burem.Data.Models
{
    public class Appointment
    {
        public int Id { get; set; }
        public int SessionId { get; set; }
        public int TherapistId { get; set; }
        [ForeignKey("TherapistId")]
        [InverseProperty("TherapistAppointments")] // Therapist.cs içindeki liste adı
        public virtual Therapist Therapist { get; set; }
        public int? UserId { get; set; }
        public DateTime AppointmentDate { get; set; } // Başlangıç

        public String AppointmentHour { get; set; }

        // --- YENİ EKLENENLER ---
        public DateTime EndDate { get; set; } // Bitiş saati (Çakışma kontrolü için şart)
        public AppointmentStatus Status { get; set; } = AppointmentStatus.Planned;
        public string? CancellationReason { get; set; } // İptal veya Gelmedi nedeni
        // -----------------------

        public string? AppointmentType { get; set; }
        public string? LocationOrLink { get; set; }
        public DateTime CreatedAt { get; set; }

        public virtual Session Session { get; set; }
        public int? CampusId { get; set; }
        public virtual Campus Campus { get; set; }
        [ForeignKey("UserId")]
        [InverseProperty("StudentAppointments")] // User.cs içindeki liste adı
        public virtual User User { get; set; }

        public bool IsDeleted { get; set; }

        // Randevu ile ilgili notlar/açıklama
        public string? Description { get; set; }

        // Kaçıncı seans olduğu (Varsayılan 1)
        public int SessionNumber { get; set; }
    }
}