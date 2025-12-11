using System.ComponentModel.DataAnnotations;

namespace Burem.API.DTOs
{
    public class UserCreateDto
    {
        [Required]
        public string FirstName { get; set; }
        [Required]
        public string LastName { get; set; }

        public string Email { get; set; }
        [Required]
        public string UserName { get; set; }

        [Required] // Şifre Identity tarafından şifrelenecek
        public string Password { get; set; }

        // Kullanıcının Rolünü (Identity Role) ve UserType'ını belirler
        [Required]
        public string UserType { get; set; } // Admin, Secretary, Therapist

        public string TherapistCategory { get; set; } // Opsiyonel: Sadece Therapist ise doldurulur
        public bool IsActive { get; set; } = true;
    }
}
