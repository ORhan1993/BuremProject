namespace Burem.API.DTOs
{
    // Basit bir Result DTO'su (Bunu ayrı bir dosyada DTOs klasöründe tutabilirsiniz)
    public class ServiceResultDto
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; }
        public object Data { get; set; }
    }
}
