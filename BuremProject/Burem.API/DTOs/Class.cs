
namespace Burem.API.DTOs
{
    public class StudentPreFillDto
    {
        public string StudentNo { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string MobilePhone { get; set; }
        public string Gender { get; set; } // "1" veya "2" yerine "Erkek"/"Kadin" döneceğiz
        public string BirthYear { get; set; }
        public string Faculty { get; set; }
        public string Department { get; set; }
        public string Semester { get; set; }
        public string AcademicLevel { get; set; }
    }
}