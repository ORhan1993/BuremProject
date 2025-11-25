

namespace Burem.API.DTOs
{
    // React'e gönderilecek detay verisi
    public class SessionDetailDto
    {
        public int SessionId { get; set; }
        public string StudentName { get; set; }
        public string StudentNumber { get; set; }
        public string SessionDate { get; set; }
        public string AdvisorName { get; set; }
        public List<SessionAnswerDto> Answers { get; set; }
    }

  
   

   
}