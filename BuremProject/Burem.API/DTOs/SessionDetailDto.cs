using System.Collections.Generic;

namespace Burem.API.DTOs
{
    public class SessionDetailDto
    {
        public int SessionId { get; set; }
        public string StudentName { get; set; }
        public string StudentNumber { get; set; }
        public string SessionDate { get; set; }
        public string AdvisorName { get; set; }
        public string PreferredMeetingType { get; set; }

        // --- EKLENEN KİŞİSEL VE AKADEMİK BİLGİLER ---
        public string Faculty { get; set; }
        public string Department { get; set; }
        public string ClassLevel { get; set; } // Örn: "3. Sınıf"
        public string Phone { get; set; }
        public string Email { get; set; }
        // -------------------------------------------

        public List<SessionAnswerDto> Answers { get; set; }
    }
}