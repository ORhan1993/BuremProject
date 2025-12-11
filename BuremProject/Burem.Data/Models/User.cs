using Burem.Data.Enums;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Burem.Data.Models
{
    public class User
    {
        public int Id { get; set; }
        public string UserName { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }

        // Düzeltme: İlişkisel veritabanı mantığı için UserType int olmalı (Role ID)
        [Column("UserType")]
        public int RoleId { get; set; }

        public string? Email { get; set; }

        public string? Password { get; set; }

        public string? TherapistCategory { get; set; }

        // Düzeltme: Senin yapında IsDeleted yok, IsActive var.
        public int IsDeleted { get; set; }

        public int Status { get; set; }


        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation Property (İsteğe bağlı ama önerilir)
         public virtual Role Role { get; set; }
        
        public ICollection<Appointment> StudentAppointments { get; set; }
    }
}