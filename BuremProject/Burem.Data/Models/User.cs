using Burem.Data.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Burem.Data.Models
{
    public partial class User
    {
        public User()
        {
            StudentAppointments = new HashSet<Appointment>();
            TherapistAppointments = new HashSet<Appointment>();
        }

        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(150)]
        public string FirstName { get; set; } = null!;

        [Required]
        [StringLength(150)]
        public string LastName { get; set; } = null!;

        [Required]
        public string UserName { get; set; } = null!;

        // --- ROL AYARLARI ---

        // Veritabanındaki 'int' değer (1, 2, 3, 4)
        public int UserType { get; set; }

       

        // İlişki: Veritabanındaki 'UserRoles' tablosuna gider
        [ForeignKey("UserType")]
        public virtual Role Role { get; set; } = null!;

        // Kod içinde kullanım: int değerini Enum'a çevirir
        [NotMapped]
        public UserRole RoleEnum
        {
            get => (UserRole)UserType;
            set => UserType = (int)value;
        }

        public int Status { get; set; } = 1;
        public int IsDeleted { get; set; } = 0;

        // --- RANDEVU İLİŞKİLERİ ---
        [InverseProperty("User")]
        public virtual ICollection<Appointment> StudentAppointments { get; set; }

        [InverseProperty("Therapist")]
        public virtual ICollection<Appointment> TherapistAppointments { get; set; }

        public TherapistCategory? TherapistCategory { get; set; }
    }
}