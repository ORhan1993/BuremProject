using System.ComponentModel.DataAnnotations;

namespace Burem.API.DTOs
{
    public class UserUpdateDto
    {
        [Required]
        public int Id { get; set; }

        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string UserType { get; set; }
        public string TherapistCategory { get; set; }
        public bool IsActive { get; set; }

        // Kullanıcı şifresini değiştirmek isterse bu alan dolu gelir.
        public string NewPassword { get; set; }
    }
}
