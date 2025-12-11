using Microsoft.AspNetCore.Identity;
using Burem.Data.Enums; // TherapistCategory Enum'ı buradaysa

namespace Burem.Data.Models
{
    // IdentityUser sınıfından miras alıyoruz ki Identity özellikleri (PasswordHash, SecurityStamp vs.) gelsin.
    public class ApplicationUser : IdentityUser
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }

        // Rolü string olarak da tuttuğunu görüyorum (Admin, Sekreter vb.)
        public string UserType { get; set; }

        // Terapist kategorisi (Nullable olabilir, çünkü her kullanıcı terapist değil)
        public TherapistCategory? TherapistCategory { get; set; }

        // Silinme durumu (0: Aktif, 1: Silinmiş)
        public int IsDeleted { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}