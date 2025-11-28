namespace Burem.Data.Models
{
    // Bu bir CLASS değil, ENUM olmalıdır.
    public enum UserRole : int
    {
        Admin = 1,
        Sekreter = 2,
        Ogrenci = 3,  // Türkçe karakter kullanmamaya özen gösterin (Ogrenci)
        Terapist = 4
    }
}