namespace Burem.API.DTOs
{
    public class AddHolidayDto
    {
        public string Date { get; set; }       // Örn: "2025-01-01"
        public string Description { get; set; } // Örn: "Yoğun Kar Yağışı Tatili"
        public int CurrentUserRoleId { get; set; } // İşlemi yapan kişinin rolü
    }
}