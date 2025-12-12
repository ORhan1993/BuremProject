using System.Collections.Generic;

namespace Burem.API.DTOs
{
    public class SessionAnswerDto
    {
        public int QuestionId { get; set; }
        public string QuestionTitle { get; set; }
        public string QuestionType { get; set; }

        public string AnswerValue { get; set; } // Form için ID (Örn: "1")
        public string AnswerText { get; set; }  // Görüntüleme için Metin (Örn: "Evet")

        public List<SessionOptionDto> Options { get; set; }
    }
}