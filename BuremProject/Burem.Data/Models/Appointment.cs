using Burem.Data.Enums;
using System;
// Enum namespace'ini eklemeyi unutmayın (namespace Burem.Data.Models ise gerekmez)

namespace Burem.Data.Models
{
    public class Appointment
    {
        public int Id { get; set; }
        public int SessionId { get; set; }
        public int TherapistId { get; set; }
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
        public virtual User? User { get; set; }
    }
}