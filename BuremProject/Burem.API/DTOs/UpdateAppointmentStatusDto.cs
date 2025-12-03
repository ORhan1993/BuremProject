namespace Burem.API.DTOs
{
    // Randevu Güncelleme (Durum Değiştirme) Modeli
    public class UpdateAppointmentStatusDto
    {
        public int AppointmentId { get; set; }
        public int Status { get; set; } // Enum int değeri
        public string? Reason { get; set; } // İptal nedeni

        public string? TherapistNotes { get; set; } // Gizli Notlar [cite: 182]
        public string? RiskLevel { get; set; } // Risk Seviyesi [cite: 279]
        public string? ReferralDestination { get; set; } // Yönlendirme [cite: 217]
    }
}
