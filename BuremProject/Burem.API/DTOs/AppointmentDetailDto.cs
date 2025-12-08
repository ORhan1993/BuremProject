namespace Burem.API.DTOs
{
    public class AppointmentDetailDto
    {
        public int Id { get; set; }

        // Öğrencinin Adı Soyadı (Şifresi çözülmüş halde dönecek)
        public string StudentName { get; set; }

        // Terapistin Adı Soyadı (Şifresi çözülmüş halde dönecek)
        public string TherapistName { get; set; }

        // Randevu Tarihi (örn: "26.11.2025")
        public string Date { get; set; }

        // Randevu Saati (örn: "14:00")
        public string Time { get; set; }

        // Görüşme Tipi (Online / Yüz Yüze)
        public string Type { get; set; }

        // Durumu (Planned, Completed, Cancelled vb.)
        public string Status { get; set; }
    }
}