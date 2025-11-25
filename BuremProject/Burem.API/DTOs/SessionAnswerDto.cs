namespace Burem.API.DTOs
{
    public class SessionAnswerDto
    {
        public int QuestionId { get; set; }
        public string QuestionTitle { get; set; }
        public int QuestionType { get; set; } // 1:Text, 2:Radio, 3:Checkbox
        public string AnswerValue { get; set; } // Verilen cevap
        public List<SessionOptionDto> Options { get; set; } // Soru şıkları
    }

}
