namespace Burem.API.DTOs
{
    // Sorunun kendisi
    public class QuestionDto
    {
        public int ID { get; set; }
        public string QuestionTitle { get; set; }
        public int QuestionType { get; set; } // 1: Metin, 2: Tek Seçmeli, 3: Çoklu vb.
        public int? SortOrder { get; set; }

        public int? QuestionGroup { get; set; }

        public int AppForm { get; set; }

        // Sorunun seçenekleri (Varsa)
        public List<OptionDto> Options { get; set; } = new List<OptionDto>();
    }

  
}