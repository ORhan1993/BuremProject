namespace Burem.Data.Models;

public class UniversityCustomHoliday
{
    public int Id { get; set; }
    public DateTime HolidayDate { get; set; } // Sadece tarih
    public string Description { get; set; }   // Örn: "Yoğun Kar Yağışı Tatili"
}