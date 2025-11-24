

namespace Burem.API.DTOs
{
    // React'e gönderilecek detay verisi
    public class SessionDetailDto
    {
        public int SessionId { get; set; }
        public string StudentName { get; set; }
        public string SessionDate { get; set; }
        public string AdvisorName { get; set; }
        public List<SessionAnswerDto> Answers { get; set; }
    }

    public class SessionAnswerDto
    {
        public int QuestionId { get; set; }
        public string QuestionTitle { get; set; }
        public int QuestionType { get; set; } // 1:Text, 2:Radio, 3:Checkbox
        public string AnswerValue { get; set; } // Verilen cevap
        public List<string> Options { get; set; } // Soru şıkları
    }

    // React'ten gelen güncelleme isteği
    public class UpdateSessionAnswersDto
    {
        public int QuestionId { get; set; }
        public string Value { get; set; }
    }
}