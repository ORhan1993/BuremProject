using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Burem.Data.Models
{
    public class TherapistSchedule
    {
        [Key]
        public int Id { get; set; }

        public int TherapistId { get; set; }

        [ForeignKey("TherapistId")]
        public virtual User Therapist { get; set; } = null!;

        public DateTime ScheduleDate { get; set; }
        public string ScheduleTime { get; set; } = null!; // "09:00"
        public bool IsAvailable { get; set; } = true;
    }
}