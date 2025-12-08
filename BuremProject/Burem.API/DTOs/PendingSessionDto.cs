namespace Burem.API.DTOs
{
    public class PendingSessionDto
    {
        public int Id { get; set; } // Session ID
        public string Name { get; set; }
        public string StudentNo { get; set; }
        public string Faculty { get; set; }
        public string Department { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string ClassLevel { get; set; } // Örn: 3. Sınıf
        public int Term { get; set; }          // Örn: 5. Dönem
        public string RequestDate { get; set; }
        public string Status { get; set; }     // "Atama Bekliyor"
        public string ApplicationType { get; set; } // "İlk Başvuru"
        public bool KvkkApproved { get; set; } // KVKK Onayı
    }
}