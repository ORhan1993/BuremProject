namespace Burem.API.DTOs
{
    // Yeni küçük DTO (Seçenek Detayı için)
    public class SessionOptionDto
    {
        public string Label { get; set; } // Ekranda görünecek (Örn: "Kuzey Kampüs")
        public string Value { get; set; } // Arkada tutulacak (Örn: "1")
    }
}
