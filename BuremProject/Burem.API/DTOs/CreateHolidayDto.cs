namespace Burem.API.DTOs
{
    public class CreateHolidayDto
    {
        public DateTime Date { get; set; }       // Tarih
        public string Description { get; set; }  // Açıklama
        public int CurrentUserRoleId { get; set; } // Yetki Kontrolü (1:Admin, 2:Sekreter)
    }
}
