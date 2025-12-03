using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Burem.Data.Models
{
    [Table("GroupStudies")]
    public class GroupStudy
    {
        public int Id { get; set; }
        public int TherapistId { get; set; }
        public string GroupName { get; set; } // Örn: "Sosyal Beceri Grubu"
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? SessionCount { get; set; }
        public string? CompletionStatus { get; set; } // Örn: "Tamamlandı"
        public string? Notes { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }

        public virtual User Therapist { get; set; }
    }
}