namespace Burem.API.DTOs
{
    // Seçenek detayı
    public class OptionDto
    {
        public int ID { get; set; }
        public string OptionTitle { get; set; }
        public string OptionValue { get; set; }
        public int? SortOrder { get; set; }
    }
}
