using System.Collections.Generic;

namespace Burem.API.DTOs
{
    public class StudentApplicationDto
    {
        // --- Öğrenci Profil Bilgileri ---
        public string StudentNo { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Mobile { get; set; }
        public string Email { get; set; }
        public string BirthYear { get; set; }
        public string Gender { get; set; }
        public string Lifestyle { get; set; }
        public string Faculty { get; set; }
        public string Department { get; set; }
        public string Semester { get; set; }
        public string AcademicLevel { get; set; }
        public string Scholarship { get; set; }

        // Acil Durum İletişim
        public string ContactDegree { get; set; }
        public string ContactPerson { get; set; }
        public string ContactPhone { get; set; }

        // Aile Bilgileri
        public string IsMotherAlive { get; set; }
        public string IsFatherAlive { get; set; }

        // --- Form Cevapları Listesi ---
        public List<StudentAnswerDto> Answers { get; set; }
    }

  
}