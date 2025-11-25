namespace Burem.API.DTOs
{
    // React'ten gelen güncelleme isteği
    public class UpdateSessionAnswersDto
    {
        public int QuestionId { get; set; }
        public string Value { get; set; }
    }
}
